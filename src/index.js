// require('dotenv').config({path: './env'});
import dotenv from 'dotenv'
import connectDB from './db/index.js';
import {app} from './app.js'

dotenv.config({
    path: './.env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server running on port ${process.env.PORT || 8000}`);
    })
})
.catch((err)=>{
    console.log("Error: ",err);
    process.exit(1);
})


/*
const app = express();

;(async ()=> {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => console.log("ERROR: ",error))
        app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`))
    }catch(error){
        console.log("ERROR: ",error)
    }
})()

*/