# MongoDB Online & Local Setup

## Online (MongoDB Atlas)

1. Create cluster at https://www.mongodb.com/cloud/atlas
2. Get connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/wdp-ecs?retryWrites=true&w=majority`
3. Set in `.env`:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/wdp-ecs?retryWrites=true&w=majority
   ```

## Local MongoDB

1. Install MongoDB Community: https://docs.mongodb.com/manual/installation/
2. Start MongoDB:
   - **Windows**: `mongod`
   - **Mac/Linux**: `brew services start mongodb-community`
3. Default URI: `mongodb://localhost:27017/wdp-ecs` (fallback in code)

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/wdp-ecs
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```
