# Load Balancing

## 1. Overview

Load balancing is the process of distributing incoming network traffic, requests, or workloads across multiple servers or resources to ensure:
- **High availability** — No single point of failure
- **Scalability** — Handle increased traffic by adding more servers
- **Performance** — Optimal resource utilization and reduced latency
- **Fault tolerance** — Automatic failover when servers fail

---

## 2. Why Load Balancing Matters

### Problems Without Load Balancing
- Single server becomes a bottleneck
- Server downtime causes complete service outage
- Uneven resource utilization (some servers idle, others overloaded)
- Poor response times during traffic spikes

### Benefits
- Distribute load evenly across servers
- Increase system throughput and reduce latency
- Enable horizontal scaling (add more servers)
- Improve fault tolerance and redundancy

---

## 3. Load Balancing Layers

### Layer 4 (Transport Layer) — Network Load Balancing
- Operates at TCP/UDP level
- Makes routing decisions based on IP protocol data
- Fast and lightweight
- Good for throughput and extreme performance
- **Examples:** AWS Network Load Balancer (NLB)

### Layer 7 (Application Layer) — Application Load Balancing
- Operates at HTTP/HTTPS level
- Can inspect request headers, URL paths, hostnames, etc.
- Make intelligent routing decisions based on content
- Slightly slower but more intelligent routing
- **Examples:** AWS Application Load Balancer (ALB), Nginx

**Trade-off:** Layer 7 offers better routing but has higher latency; Layer 4 is faster but less intelligent.

---

## 4. Load Balancing Algorithms

### 1. **Round Robin**
- Distribute requests sequentially to each server
- Simple and fair
- **Best for:** Homogeneous servers with similar capacity

```
Server 1 <- Request 1
Server 2 <- Request 2
Server 3 <- Request 3
Server 1 <- Request 4 (cycle repeats)
```

**Pros:** Simple, no overhead  
**Cons:** Ignores server capacity, doesn't account for current load

---

### 2. **Weighted Round Robin**
- Assign weights to servers based on capacity
- More powerful servers get more requests
- **Best for:** Heterogeneous servers with different capacities

```
Server 1 (weight 2) <- Requests 1, 4
Server 2 (weight 1) <- Request 2
Server 3 (weight 1) <- Request 3
```

**Pros:** Accounts for server differences  
**Cons:** Still doesn't adapt to real-time load

---

### 3. **Least Connections**
- Route request to server with fewest active connections
- Ideal for long-lived connections (WebSockets, persistent connections)
- **Best for:** Real-time applications, chat systems

```
Server 1: 5 active connections <- New request
Server 2: 8 active connections
Server 3: 3 active connections <- Request goes here
```

**Pros:** Adaptive, good for long connections  
**Cons:** Connection count ≠ actual load

---

### 4. **Weighted Least Connections**
- Combine least connections with server weights
- More powerful servers can handle more concurrent connections

---

### 5. **IP Hash (Source IP Hashing)**
- Hash the client's IP address to determine server
- **Best for:** Session persistence, stateful applications

```
hash(client_ip) % num_servers = server_id
```

**Pros:** Sticky sessions (same client always goes to same server)  
**Cons:** Uneven distribution if many clients share same IP; breaks if servers added/removed

---

### 6. **Consistent Hashing**
- Uses a hash ring to map clients to servers
- When a server is added/removed, only a fraction of keys need remapping
- **Best for:** Distributed caching, service discovery

```
Ring: 0 --- 120 --- 240 --- 360
       |      |       |
      S1     S2      S3
      
Client hash maps to nearest server on ring
```

**Pros:** Minimal disruption when scaling  
**Cons:** More complex to implement

---

### 7. **Least Response Time**
- Route to server with lowest average response time + fewest connections
- Most dynamic and intelligent
- **Best for:** Real-world deployments with varying workloads

```
Server 1: avg_latency=50ms, connections=5
Server 2: avg_latency=30ms, connections=8  <- Choose this
Server 3: avg_latency=40ms, connections=3
```

**Pros:** Adapts to real-time conditions  
**Cons:** Requires monitoring overhead

---

### 8. **Random**
- Route request to random server
- Surprisingly effective at scale
- **Best for:** High-volume, stateless services

**Pros:** Simple, no state needed  
**Cons:** Uneven distribution, no awareness of load

---

## 5. Load Balancer Placement

### Single Load Balancer
```
                    Load Balancer
                          |
            ______________|______________
           |              |              |
        Server 1      Server 2      Server 3
```

**Problem:** Load balancer becomes a bottleneck and SPOF

---

### Multiple Load Balancers (Highly Available)
```
        LB 1 (Active)           LB 2 (Standby)
              |                      |
              └──────────┬───────────┘
                         |
            ______________|______________
           |              |              |
        Server 1      Server 2      Server 3
```

- Use **heartbeat/health checks** between load balancers
- **Active-Passive:** One active, others in standby (failover)
- **Active-Active:** Both handle traffic (needs session sharing)

---

### Geographic Load Balancing
```
User in US  ─┐
User in EU  ─┤─→ Geographic LB ─→ Route to nearest datacenter
User in APAC┘
                └─→ US Data Center
                └─→ EU Data Center
                └─→ APAC Data Center
```

---

## 6. Health Checks

Critical for removing failed servers from rotation.

### Types of Health Checks

1. **Passive Health Check** — Monitor request failures in real-time
2. **Active Health Check** — Periodically ping servers
   - HTTP request to `/health` endpoint
   - TCP connection check
   - Ping/ICMP

### Implementation
```
Every 10 seconds:
  GET /health → Server responds 200 OK ✓
  GET /health → Server responds 500 Error ✗ → Mark unhealthy
  
Unhealthy server removed from rotation
Queue requests for this server to healthy servers
When server recovers → Add back to rotation
```

---

## 7. Session Persistence (Sticky Sessions)

Problem: Stateful applications require user requests to go to same server.

### Solutions

1. **Client-side Sticky (IP Hash)**
   - Hash client IP to determine server
   - **Pro:** No state in load balancer  
   - **Con:** Breaks with client IP changes

2. **Server-side Sticky (Token-based)**
   - Load balancer adds cookie to client
   - Cookie contains server ID
   - **Pro:** Reliable persistence  
   - **Con:** Cookie must survive redirects

3. **Distributed Sessions**
   - Store sessions in shared cache (Redis)
   - Any server can handle any request
   - **Pro:** True stateless; better fault tolerance  
   - **Con:** Adds latency for session lookup

```
Request 1: User → LB → Server 1 → Sets cookie "SID=1"
Request 2: User → LB (sees cookie) → Server 1
```

---

## 8. Sticky Sessions Trade-offs

| Aspect | Client IP Hash | Token/Cookie | Distributed |
|--------|---|---|---|
| Load Distribution | Uneven (IP skew) | Even | Even |
| Fault Tolerance | Poor (IP → dead server) | Poor (token → dead server) | Good (any server works) |
| Latency | Low | Low | Medium (Redis lookup) |
| Scalability | Hard (IP distribution) | Hard (server mapping) | Easy (stateless) |

**Best Practice:** Use distributed sessions when possible (scales better, fault tolerant).

---

## 9. Common Load Balancer Solutions

### Software
- **Nginx** — High-performance, can handle thousands of connections
- **HAProxy** — Open-source, feature-rich, Layer 4 & 7
- **Apache HTTP Server** — Classic, with mod_proxy

### Hardware
- F5 BIG-IP, Citrix NetScaler — Enterprise-grade

### Cloud Services
- **AWS ELB** (Classic), **ALB** (Layer 7), **NLB** (Layer 4)
- **Google Cloud Load Balancing**
- **Azure Load Balancer**

---

## 10. Challenges & Considerations

### 1. **Connection Draining**
When removing a server, stop sending new requests but keep existing connections alive until they complete.

### 2. **SSL/TLS Termination**
- **Terminate at LB:** Clients ↔ LB (SSL) ↔ Servers (plain)
  - **Pro:** Reduced CPU on servers  
  - **Con:** LB sees all traffic
- **End-to-end SSL:** Clients ↔ LB ↔ Servers (all SSL)
  - **Pro:** Better security  
  - **Con:** More server CPU

### 3. **Cross-Zone Load Balancing**
Route traffic across multiple availability zones to handle zone failures.

### 4. **Rate Limiting**
Prevent single client from overwhelming the system:
```
Max 100 req/sec per IP
Max 1000 req/sec per user
```

### 5. **Circuit Breaker Pattern**
Stop sending requests to servers that keep failing:
```
Healthy → 3 failures → Open (reject requests)
       → timeout → Half-open (test with single request)
            ↓
         Success → Healthy (resume traffic)
         Failure → Open (try again later)
```

---

## 11. Real-World Architecture Example

```
                     ┌─────────────────────────────┐
                     │  Global Load Balancer       │
                     │  (Geographic Routing)       │
                     └──────────────┬──────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
          │  US Region      │ │  EU Region   │ │  APAC Region │
          └────────┬────────┘ └──────┬───────┘ └──────┬───────┘
                   │                 │               │
            ┌──────▼──────┐   ┌──────▼───┐   ┌──────▼───┐
            │  ALB (L7)   │   │ ALB (L7) │   │ ALB (L7) │
            └──────┬──────┘   └──────┬───┘   └──────┬───┘
                   │                 │               │
    ┌──────────────┼──────────────┐  │               │
    │              │              │  │               │
┌───▼────┐  ┌──────▼───┐  ┌──────▼──┐
│Server 1 │  │ Server 2 │  │Server 3 │
└────┬────┘  └──────────┘  └─────────┘
     │
  Session Store (Redis)
     │
  Database (Multi-region)
```

---

## 12. Key Takeaways

1. **Choose the right algorithm** — Match to your use case (latency, connections, capacity)
2. **Health checks are essential** — Automatically remove failed servers
3. **HA matters** — Load balancer itself should be redundant
4. **Session management** — Avoid sticky sessions when possible (use distributed sessions)
5. **Monitor and observe** — Track load balancer metrics, latencies, error rates
6. **Layer 7 > Layer 4 for content routing**, but Layer 4 for extreme throughput
7. **Graceful degradation** — Design load balancer to handle cascading failures
