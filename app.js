const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());

let db = null;

// initialize db and server
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at: http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer(); //calling initialize db and server function

// convert player details table db obj to resObj
const convertPlayerDetailsTableDbObjToResObj = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

//  convert match details table db obj to response obj
const convertMatchDetailsTableDbObjToResObj = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

// API's
//#1 get all the players in the table
app.get("/players/", async (req, res) => {
  const allPlayersDetailsQuery = `
        SELECT *
        FROM player_details;`;
  const playersList = await db.all(allPlayersDetailsQuery);
  res.send(
    playersList.map((eachPlayer) =>
      convertPlayerDetailsTableDbObjToResObj(eachPlayer)
    )
  );
});

//#2 get player details with player id
app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerDetailsQuery = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId};`;
  const playerDetails = await db.get(getPlayerDetailsQuery);
  res.send(convertPlayerDetailsTableDbObjToResObj(playerDetails));
});

//#3 add player to player details table in db
app.put(`/players/:playerId/`, async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;
  const addPlayerDetailsQuery = `
        UPDATE player_details 
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};`;
  await db.run(addPlayerDetailsQuery);
  res.send("Player Details Updated");
});

//#4 get match details with the match id
app.get(`/matches/:matchId/`, async (req, res) => {
  const { matchId } = req.params;
  const getMatchDetailsQuery = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  res.send(convertMatchDetailsTableDbObjToResObj(matchDetails));
});

//#5 get match details with player id
app.get(`/players/:playerId/matches`, async (req, res) => {
  const { playerId } = req.params;
  const getMatchDetailsQuery = `
        SELECT  *
        FROM player_match_score
        NATURAL JOIN match_details
        WHERE player_id = ${playerId};`;
  const matchDetails = await db.all(getMatchDetailsQuery);
  res.send(
    matchDetails.map((eachMatch) =>
      convertMatchDetailsTableDbObjToResObj(eachMatch)
    )
  );
});

//#6 get all players played in a specific match with match id
app.get(`/matches/:matchId/players`, async (req, res) => {
  const { matchId } = req.params;
  const getPlayerQuery = `
        SELECT *
        FROM player_match_score
        NATURAL JOIN player_details
        WHERE match_id = ${matchId};`;
  const playersList = await db.all(getPlayerQuery);
  res.send(
    playersList.map((eachPlayer) =>
      convertPlayerDetailsTableDbObjToResObj(eachPlayer)
    )
  );
});

//#7 get all stats of a player
app.get(`/players/:playerId/playerScores`, async (req, res) => {
  const { playerId } = req.params;
  const getPlayerStats = `
        SELECT 
            player_match_id AS playerId,
            player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM player_match_score
        NATURAL JOIN player_details
        WHERE player_id = ${playerId};`;
  const playerStats = await db.get(getPlayerStats);
  res.send(playerStats);
});

module.exports = app;
