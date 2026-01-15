# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints                                   | Database SQL                           |
| --------------------------------------------------- | ------------------ | --------------------------------------------------- | -------------------------------------- |
| View home page                                      | home.tsx           | None                                                | None                                   |
| Register new user<br/>(t@jwt.com, pw: test)         | register.tsx       | POST /api/auth                                      | INSERT INTO user, userRole             |
| Login new user<br/>(t@jwt.com, pw: test)            | login.tsx          | PUT /api/auth                                       | SELECT FROM user, INSERT INTO auth     |
| Order pizza                                         | menu.tsx           | GET /api/order/menu                                 | SELECT FROM menu                       |
| Verify pizza                                        | payment.tsx        | POST /api/order/verify                              | N/A                                    |
| View profile page                                   | dinerDashboard.tsx | GET /api/user/me                                    | SELECT FROM user                       |
| View franchise<br/>(as diner)                       | franchiseDashboard | GET /api/franchise, GET /api/franchise/{userId}     | SELECT FROM franchise, userRole        |
| Logout                                              | logout.tsx         | DELETE /api/auth                                    | DELETE FROM auth                       |
| View About page                                     | about.tsx          | None                                                | None                                   |
| View History page                                   | history.tsx        | GET /api/order                                      | SELECT FROM dinerOrder, userRole       |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) | login.tsx          | PUT /api/auth                                       | SELECT FROM user, INSERT INTO auth     |
| View franchise<br/>(as franchisee)                  | franchiseDashboard | GET /api/franchise/{userId}                         | SELECT FROM franchise, store, userRole |
| Create a store                                      | franchiseDashboard | POST /api/franchise/{franchiseId}/store             | INSERT INTO store                      |
| Close a store                                       | franchiseDashboard | DELETE /api/franchise/{franchiseId}/store/{storeId} | DELETE FROM store                      |
| Login as admin<br/>(a@jwt.com, pw: admin)           | login.tsx          | PUT /api/auth                                       | SELECT FROM user, INSERT INTO auth     |
| View Admin page                                     | adminDashboard.tsx | GET /api/franchise                                  | SELECT FROM franchise, userRole        |
| Create a franchise for t@jwt.com                    | adminDashboard.tsx | POST /api/franchise                                 | INSERT INTO franchise, userRole        |
| Close the franchise for t@jwt.com                   | adminDashboard.tsx | DELETE /api/franchise/{franchiseId}                 | DELETE FROM franchise                  |
