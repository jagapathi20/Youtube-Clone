# Subscription Module

## Database Schema Design

The `Subscription` model is designed as a join-table to handle the many-to-many relationship between users (subscribers) and channels.

### **Model Definition**
- **Subscriber**: Reference to the `User` model.
- **Channel**: Reference to the `User` model being subscribed to.
- **Timestamps**: Automatically managed `createdAt` and `updatedAt` fields for activity tracking.

---

##  Performance Optimizations

### **1. Advanced Indexing Strategy**
To ensure the platform remains performant as the user base scales, the following indexes were implemented:

* **Compound Unique Index**: `{ subscriber: 1, channel: 1 }`
    * **Algorithmic Efficiency**: Reduces search complexity from $O(N)$ (linear scan) to $O(\log N)$ (index seek) using B-tree structures.
    * **Race Condition Mitigation**: Enforces data integrity at the database layer. Even if concurrent API requests are made, the unique constraint prevents duplicate subscription records.
* **Individual Field Indexes**: `{ subscriber: 1 }` and `{ channel: 1 }
    * Optimizes "Get Subscribed Channels" and "Get Channel Subscribers" queries respectively.



### **2. Aggregation Pipeline Efficiency**
The backend utilizes MongoDB’s Aggregation Framework to handle complex data joins.

* **Early Filtering**: The `$match` stage is placed at the beginning of the pipeline to leverage indexes and reduce the document set before performing `$lookup` operations.
* **Memory Management**: By projecting only necessary fields (e.g., `username`, `avatar`) within the pipeline, we minimize the RAM usage on the database server and reduce the network payload size.

---

##  Scalability 

1.  **Read vs. Write Trade-offs**: We prioritize Read performance (checking subscription status) over Write performance, as subscription checks happen significantly more often than the act of subscribing.
2.  **Data Integrity**: Using database-level constraints instead of relying solely on application logic to handle edge cases like double-clicks.
3.  **System Bottlenecks**: Identifying that without indexes, the `subscriptions` collection would become a primary bottleneck as it grows to millions of records.
4.  **Operational Awareness**: Designing for production-ready environments where query optimization directly correlates to lower infrastructure costs and better user experience.

---

# API Pagination & Performance

## Problem Statement
As the dataset grows (e.g., thousands of Tweets or Subscriptions), fetching all records in a single request creates a significant performance bottleneck. This leads to:
- **High Latency:** Long database execution times due to $O(N)$ collection scans.
- **Resource Exhaustion:** Excessive RAM usage on the server and high network bandwidth consumption.
- **Degraded UX:** Frontend lag and slow initial load times for the user.

## Implementation: Offset-based Pagination
For the `getUserTweets` and subscription-related controllers, I implemented **Offset-based Pagination** using `skip` and `limit`.

### **Key Features**
- **Dynamic Controls:** Supports `page` and `limit` query parameters for flexible data fetching.
- **Concurrent Execution:** Utilized `Promise.all()` to execute the data fetch and the total document count simultaneously.
- **Rich Metadata:** Returns a structured response including `totalPages`, `hasNextPage`, and `totalTweets` to empower the frontend UI logic.



## Scalability

### **1. Performance Optimization ($O(\log N)$)**
By combining pagination with **Database Indexing** on fields like `owner` or `subscriber`, the database can skip irrelevant records at the index level before the `skip` and `limit` operations are applied. This ensures that the first few pages of results are returned with near-constant time complexity.

### **2. Reducing Latency with Parallelism**
Instead of sequential execution, running the data query and the count query in parallel reduces total API response time by roughly **50%**. This is a critical optimization for high-traffic microservices where every millisecond counts.

### **3. Advanced Alternatives: Cursor-based Pagination**
While offset-based pagination is ideal for jump-to-page features, I am aware of its limitations at the extreme scale (e.g., millions of records), where `skip` becomes $O(N)$. For such scenarios, **Cursor-based Pagination** (using a pointer to the last-seen ID) is the preferred alternative to maintain $O(1)$ performance.

### **4. Memory & Payload Efficiency**
By limiting the result set, we ensure the Node.js event loop is not blocked by processing massive JSON objects, and we reduce the "Time to First Byte" (TTFB) for the client.

## The Counter Pattern
**Decision:** Transitioned from on-the-fly aggregation counting to **Write-time Denormalization** (Persistent Counter Pattern) for subscriber counts.

### 1. Problem Statement & Motivation
* **The Latency Trap:** Calculating total subscribers via `$count` or `$facet` results in $O(N)$ linear scans. 
* **Bottleneck:** Large channels with millions of subscribers would force the DB to scan massive index branches on every page load, degrading UX.

### 2. Scalability Implications
* **Performance Gain:** By storing `subscribersCount` on the `User` model, retrieval becomes an $O(1)$ operation.
* **Atomic Updates:** Used MongoDB's `$inc` operator to prevent race conditions during concurrent subscription toggles.
* **Read-Heavy Optimization:** We prioritized Read performance over Write performance, as subscriber counts are viewed far more frequently than they are changed.

### Points
* **Compound Indexing:** Utilized `{ subscriber: 1, channel: 1 }` to reduce search complexity from $O(N)$ to $O(\log N)$.
* **Parallelism:** Implemented `Promise.all()` to fetch metadata and list data concurrently, reducing API response time by ~50%.
* **Advanced Scale:** For datasets exceeding millions of records, I would recommend a transition to **Cursor-based Pagination** to avoid the performance degradation of the `skip` operator.

##  Dashboard Implementation & Scalability

### **1. Computational Efficiency**
* **The Challenge:** Fetching stats for views, videos, and likes individually would require 3-4 separate round-trips to the database.
* **The Solution:** Combined Video and Like statistics into a single **Aggregation Pipeline**. By grouping at the end of the pipeline, we reduce CPU overhead and context switching in the database engine.

### **2. Hybrid Data Retrieval**
* **Pre-calculated vs. Real-time:** * **Subscriber Count:** $O(1)$ lookup via the **Counter Pattern** on the User model.
    * **Engagement Stats:** Real-time aggregation for likes and views to ensure absolute accuracy for the creator's dashboard.

### **3. Parallel Execution ($O(1)$ Network Overhead)**
* **Implementation:** Used `Promise.all()` in the `getChannelVideos` controller to handle data fetching and document counting concurrently.
* **Impact:** Reduces the "Time to Interactive" (TTI) for the frontend by cutting the total waiting time for I/O operations by nearly half.


# System Design: Caching and Scalability Architecture

This architecture is designed to support a high-traffic video platform by prioritizing read efficiency, horizontal scalability, and data consistency.

---

### 1. High-Performance Load Balancing
To manage concurrent requests and ensure high availability, the system utilizes **Nginx** as a Layer 7 load balancer.

* **Horizontal Scaling**: Traffic is distributed across four identical Node.js instances (running on ports `1111`, `2222`, `3333`, and `4444`) to prevent any single server from becoming a bottleneck.
* **Least Connections Algorithm**: The `least_conn` directive routes new requests to the instance with the fewest active connections, optimizing resource usage for varied tasks like video processing versus metadata retrieval.
* **Data Integrity**: Nginx is configured with `proxy_set_header` (e.g., `X-Real-IP`) to ensure the backend identifies the true client source for security and analytical purposes.
* **Media Handling**: The `client_max_body_size` is set to **100M** to accommodate large video uploads that would otherwise be rejected by default Nginx limits.



---

### 2. Distributed Caching Strategy (Redis)
A **Cache-Aside** pattern is implemented via Redis to minimize database latency for read-heavy operations.

* **Personalized vs. Global Keys**: 
    * **Global**: Public video feeds and profiles use standard keys (e.g., `cache:/api/v1/videos`).
    * **Personalized**: Private data like **Watch History** or **Dashboard Stats** include the User ID in the key (e.g., `stats:u:{userId}`) to ensure isolation and privacy.
* **Write-time Invalidation (Cache Busting)**: To maintain data consistency, any POST, PATCH, or DELETE operation triggers an `invalidateCache` call. This utilizes a Redis `SCAN` and `DEL` pipeline to purge stale entries across the cluster.
* **Strategic Application**: Caching is prioritized for computationally expensive MongoDB aggregations, such as creator dashboard statistics.

---

### 3. Decoupled View Buffering & Synchronization
To avoid database write-locks during viral traffic spikes, video view counts are handled asynchronously.

* **Redis View Buffer**: Incremental views are recorded in a Redis hash (`video:views:buffer`) using the $O(1)$ `hincrby` operation.
* **Cron-based Write-Back**: A scheduled task (`viewSync.cron.js`) runs every 10 minutes to extract buffered counts and perform a **Bulk Write** to MongoDB.
* **Impact**: This transforms thousands of high-frequency database writes into a single batch operation, drastically reducing I/O overhead.



---

### 4. Optimized Data & Algorithmic Patterns
Mathematical and algorithmic efficiencies are applied to the database schema for maximum scale.

* **Persistent Counter Pattern**: Subscriber counts are denormalized and stored directly on the `User` model, turning an $O(N)$ aggregation into an **$O(1)$** lookup.
* **Compound Indexing**: A compound unique index `{ subscriber: 1, channel: 1 }` reduces search complexity from $O(N)$ to **$O(\log N)$** and prevents race conditions at the database layer.
* **Parallelism**: Controllers utilize `Promise.all()` to execute metadata counting and data fetching concurrently, reducing total API response time by roughly **50%**.

---

### 5. Orchestration & Containerization
The entire environment is orchestrated to ensure consistency across all scaled instances.

* **Dockerization**: A `node:alpine` based Dockerfile provides a lightweight and consistent runtime environment for all backend nodes.
* **Docker Compose**: Manages the lifecycle of all backend containers, ensuring they share the same environment variables and network configurations defined in the `.env` file.
* **Build Efficiency**: A `.dockerignore` file prevents local `node_modules` from bloating the image, ensuring fresh, platform-compatible installs during the build process.