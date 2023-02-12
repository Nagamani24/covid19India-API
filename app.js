const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever is starting at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializeDbAndServer();

const convertStateTable = (each) => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  };
};

const convertDistrictTable = (each) => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  };
};

//API 1

app.get("/states/", async (request, response) => {
  const listOfStatesQuery = `SELECT *
                                 FROM state`;
  const listOfStates = await db.all(listOfStatesQuery);
  response.send(listOfStates.map((eachState) => convertStateTable(eachState)));
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = ` SELECT *
                            FROM state
                            WHERE state_id = ${stateId}`;
  const getState = await db.get(getStateQuery);

  response.send({
    stateId: `${getState.state_id}`,
    stateName: `${getState.state_name}`,
    population: `${getState.population}`,
  });
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
                                    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths}) `;
  const createDistrict = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT *
                           FROM  district
                           WHERE district_id = ${districtId};`;
  const getDistrict = await db.get(getDistrictQuery);

  response.send(convertDistrictTable(getDistrict));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district
                                    WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createNewDistrictQuery = `UPDATE district 
                                    SET district_name = '${districtName}',
                                    state_id = ${stateId},
                                    cases = ${cases},
                                    cured = ${cured},
                                    active = ${active},
                                    deaths = ${deaths}
                                    WHERE district_id = ${districtId};`;
  const createNewDistrict = await db.run(createNewDistrictQuery);

  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `SELECT 
                                        cases AS totalCases,
                                        cured AS totalCured,
                                        active AS totalActive,
                                        deaths AS totalDeaths
                                   FROM state Natural Join district
                                   WHERE state_id = ${stateId};`;
  const getStatistics = await db.get(getStatisticsQuery);
  response.send(getStatistics);
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `SELECT state_name
                            FROM state inner join district
                            on state.state_id = district.state_id
                           `;
  const stateNameResult = await db.get(stateNameQuery);

  response.send({ stateName: `${stateNameResult.state_name}` });
});

module.exports = app;
