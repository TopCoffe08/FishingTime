const axios = require('axios');
const url = "https://api-apps.bmkg.go.id/api/cuaca?lon=106.826&lat=-6.176";
axios.get(url).then(r => console.log(JSON.stringify(r.data).substring(0, 500))).catch(e => console.error(e.message));
