# Index Optimization Analysis

## Original Index
```sql
CREATE INDEX idx_salary_department ON employees(salary, department);
```
- Order: (salary, department) - range condition first
- Query mismatch: Filtered department = 'Sales' first, then salary > 50000

## Why Original Was Ineffective
**Leftmost Prefix Rule violation**:
```
Query: WHERE department = 'Sales' AND salary > 50000
Index: (salary, department) ❌
```
- PostgreSQL couldn't use index because department (equality) wasn't leading column
- Range condition on leading salary column prevented efficient filtering
- Result: Full table scan inevitable

## Corrected Index
```sql
CREATE INDEX idx_department_salary ON employees(department, salary);
```
- Order: (department, salary) ✅
- Matches query pattern: equality → range

## Leftmost Prefix Rule Explained
**Rule**: PostgreSQL multicolumn indexes work left-to-right only.

```
Index: (A, B, C)
Can use: A | A+B | A+B+C
Cannot:  B | B+C | C
```

**Your case**:
```
Query:  department = 'Sales' AND salary > 50000
Good:  (department, salary) ✅
Bad:   (salary, department) ❌
```

## Performance Results
| State | Query Plan | Execution Time | Why Chosen |
|-------|------------|----------------|------------|
| No index | Seq Scan | 0.95ms | Only option |
| Wrong index | Seq Scan | 0.95ms | Index unusable |
| Correct index | Seq Scan | 0.95ms | Table too small (8 rows) |

## Key Learning
Index correctness ≠ automatic usage. PostgreSQL optimizer considers:
1. Table size (critical factor here - too small)
2. Data distribution 
3. Cache state
4. Index maintenance overhead

**To force index usage** (for demo only):
```sql
SET enable_seqscan = OFF;
EXPLAIN ANALYZE SELECT * FROM employees 
WHERE department = 'Sales' AND salary > 50000;
```