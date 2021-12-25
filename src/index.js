const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const categoryRouter = require('./routers/category');
const listingRouter = require('./routers/listing');
const ratingRouter = require('./routers/rating');
const conversationRouter = require('./routers/conversation');
const messageRouter = require('./routers/message');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(categoryRouter);
app.use(listingRouter);
app.use(ratingRouter);
app.use(conversationRouter);
app.use(messageRouter);

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});