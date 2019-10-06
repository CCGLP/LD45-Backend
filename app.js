const WebSocket = require('ws')
var async = require('async')
var MongoClient = require('mongodb').MongoClient
var moment = require('moment')


const uri = "mongodb+srv://root:iwantpizza@maxime-4zv5r.gcp.mongodb.net/admin?retryWrites=true&w=majority";
const wss = new WebSocket.Server({port:3000})
var dbClient; 

wss.on("connection", function connection(ws){
    ws.on("message", function incoming(message){
        
        var aux = JSON.parse(message)
        if (aux.id == 0){//Conexión para saber si tenemos data
        dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
        dbClient.connect(err => {
            const collection = dbClient.db("game").collection(aux.message);
            // perform actions on the collection object
            var hasGame = false; 
            var gameType = ""; 
            async.series([function(callback){
            collection.findOne({gameType:{$exists:true}}, function (err,res){
                if (res){
                    console.log(res)
                    hasGame = true; 
                    gameType = res.gameType; 
                }
                else{
                    console.log("pues no hay nah")
                    hasGame = false; 
                }
                callback(); 
            })
        }  , 
        function(callback){
            callback(); //Aqui cojo todos los datos del juego si es que hay. 
        }], function(err,res){
            var jsonToMessage = {}
            if (hasGame){
                jsonToMessage = {gameType : 0};

                if (gameType == "Action"){
                    jsonToMessage.gameType = 1; 
                }
                else if (gameType=="Narrative"){
                    jsonToMessage.gameType = 2; 
                }
            }
            else{
                jsonToMessage={gameType:-1};
            }
            var x = {id:0, message:JSON.stringify(jsonToMessage)}; 
            ws.send(JSON.stringify(x))
        }); 

            collection.estimatedDocumentCount({}, function(err,res){
                console.log(res); 
            })
            dbClient.close(); 

            
          });
        }


        if (aux.id == 1){//Conexion para actualizar juego
            dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
            dbClient.connect(err => {
                var x = JSON.parse(aux.message)
                const collection = dbClient.db("game").collection(x.cardName);
                collection.insertOne({gameType:x.gameType})
            })
        }

        if (aux.id == -1){
            console.log("DB Closed")
        }

        console.log(aux.id +" " + aux.message); 
    })


})


