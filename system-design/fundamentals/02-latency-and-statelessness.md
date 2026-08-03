Latency table
L1 = 1ns
main memory = 100ns, 
1MB from RAM = 742ns
SSD random read = 16us 
1MB from SSD = 12us
same-DC RTT  = 500us
disk seek = 2ms 
Mumbai→Singapore RTT = 
Mumbai→US-East RTT = 

You have excellent intuition for this. You accurately identified the core problems—network latency, single points of failure, and the complexity of keeping everything synchronized.

Here is an evaluation of your answers, "dressed up" with the standard industry terminology you will want to use in a system design interview.

### 1. State Inventory Table

You nailed the general concept: local state breaks because users bounce between servers, so we must move it to a centralized layer, which costs us network latency and architectural complexity.

Here is how your answers map to the formal table:

| State Type | What Breaks (The Problem) | Where it Moves (The Fix) | What it Costs (The Trade-off) |
| --- | --- | --- | --- |
| **User Sessions** | User is logged in on Server A, but appears logged out on Server B. | **External Cache** (Redis / Memcached) as you suggested. | Network hop to check login status on every single page load. |
| **In-Memory Cache** | DB query cached on Server A; Server B still hits the DB. | **Distributed Cache** (Redis) shared by all app servers. | Serialization/deserialization overhead; network latency. |
| **Uploaded Files** | Image saved to Server A's disk is broken when requested from Server B. | **Object Storage** (Amazon S3 / Google Cloud Storage). | High latency for uploads; requires configuring CDNs to serve files fast. |
| **Rate-limit Counters** | User can spam the system by hitting limits on *each* server independently. | **Redis (Centralized Counter)** or API Gateway/Load Balancer. | Redis becomes a single point of failure and a high-traffic bottleneck. |
| **WebSockets** | Connection is tied to Server A. If Server B wants to send a message to that user, it can't reach them. | **Redis Pub/Sub**. Servers publish messages to Redis, which broadcasts to the server holding the socket. | High architectural complexity; requires maintaining an active connection registry. |
| **Scheduled Jobs** | A midnight cron job runs three times (once on each server), sending duplicate emails. | **Distributed Lock** (Redis Redlock) or a central job scheduler. | Requires lock management—what happens if a server crashes while holding the lock? |
| **Background Workers** | Servers duplicate heavy tasks (like processing video) because they don't know what the others are doing. | **Message Queue** (RabbitMQ / AWS SQS / Kafka). | Infrastructure overhead; requires designing "idempotent" worker logic. |

> **Note on your Background Worker answer:** You suggested a "hash id" allocation system. That is essentially how a Message Queue works! A queue ensures a task is checked out by only one worker at a time, and if the worker crashes, the task goes back into the queue.

---

### 2. The Three Sentences

Your reasoning here was completely solid. Here is how you can phrase these points concisely for an interviewer.

**(a) The one thing vertical scaling still wins at:**
Vertical scaling keeps your architecture incredibly simple—there is zero network latency between components, no need to manage distributed state, and no complex synchronization logic to debug.

**(b) Why sticky sessions are a trap and what they cost you:**
Sticky sessions destroy fault tolerance because if a server crashes, all users "stuck" to it are violently logged out and lose their state; they also cause uneven load distribution by trapping heavy power users on a single overwhelmed machine.

**(c) The point at which "just make the box bigger" stops being the right answer:**
Vertical scaling hits a hard physical and economic ceiling; while you can technically rent an AWS instance with 24 Terabytes of RAM and 448 vCPUs, it costs around $80,000 a month, making horizontal scaling mandatory long before you hit hardware limits.

This is a classic "Day 2" system design interview question. The interviewer is testing whether you can distinguish between a catastrophic failure and acceptable technical debt, and whether you understand **data gravity** (the idea that large amounts of data are extremely hard to move).

Here is how you categorize and rank these items for a real-world migration plan.

### Category 1: "Can Stay Broken for Now" (Acceptable Tech Debt)

These items degrade efficiency or user experience, but they don't corrupt your data or break core business logic.

* **In-Memory Cache:** If Server A caches a query and Server B doesn't, Server B just hits the database. Your database load goes up, but the app still functions perfectly. You can add a distributed Redis cache later.
* **Rate-Limit Counters:** If a user gets 30 API calls across three servers instead of their allowed 10, it’s a minor leak. Unless you are defending against a massive DDoS attack, this can wait.
* **WebSockets:** WebSockets are notoriously difficult to scale. For early scaling, you can use "sticky sessions" *just* for the WebSocket traffic, or accept that real-time notifications might occasionally drop. It shouldn't block you from scaling the rest of the app.

---

### Category 2: "Must Move" (Ranked by Migration Pain)

If you don't fix these before turning on the load balancer, your app fundamentally breaks.

Here is the exact order you should migrate them, ranked from **Most Painful** to **Least Painful** to do with live traffic.

#### 1. Uploaded Files (Maximum Pain)

* **Why it's a Must-Move:** If users upload avatars to local disks, they will constantly see broken images (404s) as the load balancer routes them to servers that don't have the file.
* **Why it’s the hardest to migrate:** **Data Gravity.** Moving gigabytes or terabytes of files from a live server to Amazon S3 while users are actively uploading *new* files is a nightmare. You have to write a script to copy old files, implement "dual-writes" (writing to both local and S3 temporarily) so you don't lose live uploads during the transition, and update every database record with the new S3 URLs. Do this *before* you have heavy traffic.

#### 2. Background Workers & Scheduled Jobs (High Pain)

* **Why it's a Must-Move:** If a user clicks "Process Payment" and the load balancer sends it to Server A, but Server B also picks up the job, the user gets double-billed. If a cron job runs three times across three servers, users get spammed with duplicate emails.
* **Why it’s hard to migrate:** It requires an architectural rewrite. You have to introduce a Message Queue (like RabbitMQ or SQS), rip out your local job scheduling code, and write new "worker" processes that know how to safely lock and consume messages from the central queue without race conditions.

#### 3. User Sessions (Low Pain)

* **Why it's a Must-Move:** Users will get randomly logged out every time they click a link and land on a different server.
* **Why it’s the easiest to migrate:** Session data is tiny (just small key-value strings). You simply spin up a Redis instance and change one line in your web framework’s configuration to point sessions to Redis instead of local memory.
* **The Cheat Code:** If migrating the *historical* session data is too hard, you can just wipe them. Every active user will be forced to log in again one time. It's a mild 5-minute annoyance for your users, which is vastly cheaper than spending a week engineering a seamless session migration.

You hit the nail on the head. The root cause of both issues is **Sticky Sessions**, which is a band-aid solution for keeping state (sessions) in local memory.

Here is exactly how that single root cause creates both of your symptoms, and the exact cost of fixing it.

### Symptom 1: One server at 90% CPU while others idle

A load balancer's job is to distribute work evenly. Sticky sessions explicitly break this by forcing the load balancer to say, *"I don't care how busy Server 1 is, User A must go to Server 1."*

If you have a few "power users" doing heavy tasks (like generating massive reports or uploading large files), and they all happen to be stuck to Server 1, Server 1 will redline at 90% CPU. Servers 2 and 3 will sit idle because the load balancer is forbidden from moving those heavy users over to them.

### Symptom 2: Every deploy logs 1/3 of your users out

When you deploy new code, you have to restart your servers.
Because your sessions are stored in **local RAM**, restarting a server instantly wipes its memory. If you deploy to Server 1, its memory is cleared. Because 1/3 of your active users are "stuck" to Server 1, their session data vanishes, and they are violently logged out.

---

### The Fix

As you correctly pointed out, you must **drop sticky sessions** and move the session data to a centralized cache like **Redis**.

Once session data lives in Redis:

1. The load balancer can freely bounce a user from Server 1 to Server 2, because Server 2 can just ask Redis if the user is logged in. Load becomes perfectly even.
2. You can reboot Server 1 all you want. The server's local memory is empty anyway, so no one gets logged out.

### The Latency Cost

When sessions lived in local memory, checking if a user was logged in took nanoseconds.

By moving sessions to Redis, every single HTTP request now requires a network hop over your data center's internal network to ask Redis for the session data.

* **The Number:** This adds roughly **1 millisecond (1 ms)** of latency to every single web request. (It is a small price to pay for a perfectly balanced, fault-tolerant system).