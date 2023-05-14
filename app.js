const express=require('express');
const {open}=require('sqlite');
const sqlite3=require('sqlite3');
const path=require('path');
const dbPath=path.join(__dirname,'todoApplication.db');
const app=express();
app.use(express.json());
let db=null;
const initDbAndServer=async()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database,
        });
        app.listen(3000,()=>console.log('Server Running'));
    }catch(err){
        console.log(`error:${err.msg}`);
        process.exit(1);
    }
};
initDbAndServer();
const hasPriorityAndStatusProperty=(request)=>{
    return request.priority!==undefined && request.status!==undefined;
};
const hasPriorityProperty=(request)=>{
    return request.priority!==undefined;
};
const hasStatusProperty=(request)=>{
    return request.status!==undefined;
};
app.get('/todos/',async(request,response)=>{
   let data=null;
   let getTodos='';
   const {search_q='',priority,status}=request.query;
   switch (true) {
       case hasPriorityAndStatusProperty(request.query):
           getTodos=`
           SELECT *
           FROM todo
           WHERE todo LIKE '%${search_q}%'
                  AND status= '${status}'
                  AND priority= '${priority}';`;

           break;
        case hasPriorityProperty(request.query):
           getTodos=`
           SELECT *
           FROM todo
           WHERE todo LIKE '%${search_q}%'
                  AND priority= '${priority}';`;

           break;
        case hasStatusProperty(request.query):
           getTodos=`
           SELECT *
           FROM todo
           WHERE todo LIKE '%${search_q}%'
                  AND status= '${status}';`;

           break;
   
       default:
           getTodos=`
           SELECT *
           FROM todo
           WHERE todo LIKE '%${search_q}%';`;
           break;
   }
   data=await db.all(getTodos);
   response.send(data);
});
app.get('/todos/:todoId/',async(request,response)=>{
    const {todoId}=request.params;
    const getTodo=`
    SELECT *
    FROM todo
    WHERE id=${todoId};`;
    const todo =await db.get(getTodo);
    response.send(todo);
});
app.post('/todos/',async(request,response)=>{
    const {id,todo,priority,status}=request.body;
    const postTodo=`
    INSERT INTO 
    todo (id,todo,priority,status)
    VALUES 
    {${id},'${todo}','${priority}','${status}'};`;
    await db.run(postTodo);
    response.send('Todo Successfully Added');
});
app.put('/todos/:todoId/',async(request,response)=>{
    const {todoId}=request.params;
    let updateColumn='';
    const requestBody=request.body;
    switch(true){
        case requestBody.status!==undefined:
            updateColumn='Status';
            break;
        case requestBody.priority!==undefined:
            updateColumn='Priority';
            break;
        case requestBody.todo!==undefined:
            updateColumn='Todo';
            break;
    }
    const getPreviousTodo=`
    SELECT *
    FROM todo
    WHERE id=${todoId};`;
    const previousTodo= await db.get(getPreviousTodo);
    const{
        todo=previousTodo.todo,
        priority=previousTodo.priority,
        status=previousTodo.status,
    }=request.body;
    const updateTodo=`
    UPDATE todo
    SET 
        todo='${todo}',
        priority='${priority}'
        status='${status}'
    WHERE id=${todoId};`;
    await db.run(updateTodo);
    response.send(`${updateColumn} Updated`);
});
app.delete('/todos/:todoId/',async (request,response)=>{
    const {todoId}=request.params;
    const deleteTodo=`
    DELETE FROM 
    todo
    WHERE id=${todoId};`;
    await db.run(deleteTodo);
    response.send('Todo Deleted');
});
module.exports=app;
