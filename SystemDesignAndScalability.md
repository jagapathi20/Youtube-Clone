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
