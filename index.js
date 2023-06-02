import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connect from './database/conn.js';
import router from './router/route.js';
import bodyParser from 'body-parser'; 
import router2 from './router/router2.js';
import "./router/config.js"
import User from './model/User.model.js';
import cookieParser from 'cookie-parser';
import cryptoRandomString from 'crypto-random-string';
import session from 'express-session';
import { MemoryStore } from 'express-session';
import serverless from 'serverless-http';

const app = express();
app.use(express.static('public'))
/** middlewares */
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));
app.disable('x-powered-by'); // less hackers know about our stack
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
router.use(bodyParser.json());
const port = process.env.PORT || 8080;
const sessionSecret = cryptoRandomString({ 
  length: 6, 
  type: 'numeric' 
});


// Add config variable declaration
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));
/** Https get req */

app.get('/', (req,res)=>{
  res.status(201).json("home get request")
})

app.get('/users', (req,res)=>{
  res.status(201).json("its working finilla😍😍😍😍")
})

/** api routes */
app.use('/api' , router )
app.use("/api", router2);

app.get('/my-route', (req, res) => {
  const apiURL = 'https://fzhbd6hzj1.execute-api.ap-south-1.amazonaws.com/dev';
  const ipAddress = req.ip; // Get the IP address of the client making the request

  https.get(apiURL, { headers: { 'x-forwarded-for': ipAddress } }, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log(data);
      res.send('Hello from Lambda');
    });
  }).on('error', (error) => {
    res.status(500).send(error.message);
  });
});


/** start server */
connect().then(()=>{
  try {
 
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
    
  } catch (error) {
    console.log('cannot connect to the server')
  }
}).catch(error => {
  console.log("invalid database connection.... !")
})



export const handler = serverless(app);

