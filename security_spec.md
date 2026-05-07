# Data Invariants
- A resume cannot exist without a valid user.
- The `ownerId` of the resume must strictly match the ID of the user.

# Dirty Dozen Payloads
1. Create resume with missing ownerId
2. Create resume with ownerId matching another person
3. Update someone else's resume
4. Update `ownerId` to someone else after creation
5. Inject massive string into `id` (e.g. 1MB string)
6. Write invalid types to resume fields
7. Create resume without required fields (personalInfo, experience, etc.)
8. Give self Admin role by passing `isAdmin: true` inside a payload
9. Try to join/update a user profile that's not auth'd
10. Blanket read bypassing `ownerId` check
11. Update immutable field like `createdAt`
12. Creating a subcollection on resume without owner permission

# Test Runner
To be implemented via ESLint checks and test scripts.
