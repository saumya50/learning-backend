const asynchandler =(requesthandler)=>(
    (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next)).catch((err)=>next(err))
    }
)













// const asynchandler = (fn) =>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (err) {
//         res.status(err.code || 500).json({
//             succes:false,
//             message:err.message
//         })
//     }
// }