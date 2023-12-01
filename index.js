
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middlewares
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('final assignment server is running')
})

app.listen(port, () => {
    console.log(`Final Assignment Server Is Running On Port: ${port}`);
})
