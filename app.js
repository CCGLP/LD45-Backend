const WebSocket = require('ws')
var async = require('async')
var MongoClient = require('mongodb').MongoClient
var moment = require('moment')


const uri = "mongodb+srv://root:iwantpizza@maxime-4zv5r.gcp.mongodb.net/admin?retryWrites=true&w=majority";
const wss = new WebSocket.Server({port:3000})

wss.on("connection", function connection(ws){
    ws.on("message", function incoming(message){
        
        
        var aux = JSON.parse(message)

        if (aux.id == 0){//Conexión para saber si tenemos data
        let dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
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
            let dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
            dbClient.connect(err => {
                var x = JSON.parse(aux.message)
                const collection = dbClient.db("game").collection(x.cardName);
                collection.insertOne({gameType:x.gameType})
                dbClient.close(); 

            })
        }

        if (aux.id == 2){//Coger datos del juego de plataformas. 
            let dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
            dbClient.connect(err => {
                const collection = dbClient.db("game").collection(aux.message);
                var y = {data:[]}; 
                async.series([function(callback){
                        collection.find({type:{$exists:true}}).toArray(function(err,res){
                            console.log(res)
                            for (var i = 0; i< res.length; i++){
                                y.data[i] = res[i]; 
                            }
                            callback(); 
                        })
                }], function(err,res){
                    var message = {id:2, message:JSON.stringify(y)}
                    ws.send(JSON.stringify(message)); 
                })
            })
            dbClient.close(); 
        }

        if (aux.id == 3){//Enviar datos juego plataformas
           let dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
            dbClient.connect(err => {
                var x = JSON.parse(aux.message)
                const collection = dbClient.db("game").collection(x.cardType);
                var canContinue = false; 
                async.series([function(callback){
                    if (x.type == "jump" ){
                        collection.updateOne({type:x.type}, {$set:{y:x.y}}, function(err,res){
                            if(err){
                                canContinue = true;
                            }
                            else if (res.result.nModified== 0) {
                                canContinue = true; 
                            }
                            callback(); 
                        })
                    }
                    else if (x.type=="speed"){
                        collection.updateOne({type:x.type}, {$set:{x:x.x}}, function(err,res){
                            if(err){
                                canContinue = true;
                            }
                            else if (res.result.nModified== 0) {
                                canContinue = true; 
                            }
                            callback(); 
                        })
                    }
                    else{
                        canContinue = true; 
                        callback(); 
                    }
                },
                function (callback){
                    if (canContinue){
                        collection.insertOne(x, function(err,res){
                            callback(); 
                        })
                    }  
                    else{
                        callback(); 
                    }
                }
            ], 
                    function(err,res){
                        console.log("Inserted succesfull");
                })
            })
            dbClient.close(); 
        }

        if (aux.id ==4){ //Coger datos juego de acción

        }

        if (aux.id == 5){//Enviar datos juego de acción

        }

        if (aux.id == 6){//Coger datos juego narrativo
            let dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
            dbClient.connect(err => {
                const collection = dbClient.db("game").collection(aux.message);
                var y = 0
                async.series([function(callback){
                    collection.find({question:{$exists:true}}).toArray(function(err,res){
                        console.log(res)
                        y = false
                        for (var i = 0; i< res.length; i++){
                            y= res[0]; 
                        }
                        callback(); 
                    })
            }], function(err,res){
                if (!y){
                    y = {question: "Once Upon a Time", answers: ["..."]}
              
                }
                var message = {id:6, message:JSON.stringify(y)}
                ws.send(JSON.stringify(message)); 
            })

            })

            dbClient.close(); 
        }

        if (aux.id == 7){//Enviar datos juego narrativo 
            let dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
            dbClient.connect(err => {
                var x = JSON.parse(aux.message)
                const collection = dbClient.db("game").collection(x.cardType);
                var canContinue = false; 
                async.series([function(callback){
                    collection.findOne({_id: x._id}, function(err,res){
                        if (err){
                            canContinue = true; 
                        }
                        else if (res){
                            x = res; 
                            canContinue = false; 
                        }
                        else{
                            canContinue = true; 
                        }
                        callback(); 
                    })
                }, function(callback){
                    if (canContinue){
                        collection.insertOne(x, function(err,res){
                            callback(); 
                        })
                    }
                    else{
                        
                        callback(); 
                    }
                }], function(err,res){
                    if (!canContinue){
                        var message = {id:6,message:JSON.stringify(x) }
                        ws.send(JSON.stringify(message))
                    }
                    else{
                        var message = {id:9}
                        ws.send(JSON.stringify(message)); 
                    }
                })
            })
            dbClient.close(); 
        }

        if (aux.id== 8){//Comprobar que existe un id de un question o no
           let dbClient = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true });
            dbClient.connect(err => {
                var x = JSON.parse(aux.message)
                const collection = dbClient.db("game").collection(x.cardType);
                var canContinue = false; 
                var found = false; 
                async.series([function(callback){
                    collection.findOne({_id:x._id}, function(err,res){
                            if (err){
                            
                            callback(); 
                        }
                        else if (res){
                            found = true; 
                            x = res; 
                            callback(); 
                        }
                        else{
                            callback(); 
                        }
                    })
                }],
                function(err,res){
                    if (!found){
                        var message = {id:8}
                        ws.send(JSON.stringify(message)); 
                    }
                    else{
                        var message = {id:6, message: JSON.stringify(x)}
                        ws.send(JSON.stringify(message)); 
                    }
                })
            })
        
        dbClient.close(); 
        }

        if (aux.id == -1){
            console.log("DB Closed")
        }

        console.log(aux.id +" " + aux.message); 
    })


})


