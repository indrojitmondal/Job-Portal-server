const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kk0ds.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
   // await client.connect();
    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    const jobsCollections = client.db('jobPortal').collection('jobs');
    const jobApplicationCollections = client.db('jobPortal').collection('applications');
    
    app.get('/jobs', async(req, res)=>{
      const email = req.query.email;
      let query={};
      if(email){
        query={hr_email: email};
      }
        const cursor = jobsCollections.find(query);
        const result = await cursor.toArray();
        res.send(result);
    })
    app.get('/jobSearch', async(req, res)=>{
      const {searchParams} = req.query;
      // let option={}
      //  option={company: {$regex: searchParams,$options:"i"},
      //  title: {$regex: searchParams,$options:"i"}
      // };
      const option = {
        $or: [
            { company: { $regex: searchParams, $options: "i" } },
            { title: { $regex: searchParams, $options: "i" } },
        ],
    };
      
        const cursor = jobsCollections.find(option);
        const result = await cursor.toArray();
        res.send(result);
    })
    app.post('/jobs', async(req,res)=>{
      
       const newJob= req.body;
       const result = await jobsCollections.insertOne(newJob);
       res.send(result);
    })
    app.get('/job-application/jobs/:job_id', async(req, res)=>{
        const jobId = req.params.job_id;
        const query= {job_id: jobId};
        const result = await jobApplicationCollections.find(query).toArray();
        res.send(result);
    })
    app.get('/jobs/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await jobsCollections.findOne(query);
        res.send(result);
    })
    app.patch('/job-application/:id', async(req, res)=>{
      const id = req.params.id;
      const data = req.body;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc={
        $set: {
            status: data.status
        }
      }
      const result= await jobApplicationCollections.updateOne(filter, updatedDoc);
      res.send(result);
    })
    app.get('/job-application', async(req, res)=>{
      const email = req.query.email;
      const query = {applicant_email: email
        
      };
     
      
      const result = await jobApplicationCollections.find(query).toArray();
      for (const application of result) {
         const query1 = {_id: new ObjectId(application.job_id)};
         const job= await jobsCollections.findOne(query1);
         if(job){
          application.title= job.title;
          application.location= job.location;
          
          application.company = job.company;
          application.company_logo = job.company_logo;
         }
      }
      
      res.send(result);
    })
   
    app.post('/job-applications', async(req, res)=>{
       const application = req.body;
       const result = await jobApplicationCollections.insertOne(application);
       
       const id = application.job_id;
       const query = {_id: new ObjectId(id)};
       const job = await jobsCollections.findOne(query);
       let NewCount =0;
       if(job.applicationCount){
        NewCount = job.applicationCount + 1;
       }
       else {
        NewCount = 1;
       }
       const filter ={_id: new ObjectId(id)};
       const updatedDoc={
        $set:{
          applicationCount: NewCount
        }
       }
       const updateResult= await jobsCollections.updateOne(filter, updatedDoc)

       res.send(result);
    })
    app.delete('/job-application/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobApplicationCollections.deleteOne(query);
      res.send(result);
    })
    
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('Job is falling from the sky..');
})

app.listen(port, ()=>{
    console.log(`Job is waiting at port: ${port}`);
})