const axios = require('axios');
const BMKG_PUBLIC_API = 'https://peta-maritim.bmkg.go.id/public_api/pelabuhan';
axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(BMKG_PUBLIC_API)}`)
  .then(res => {
    const allPorts = Array.isArray(res.data) ? res.data : Object.values(res.data);
    console.log(JSON.stringify(allPorts[0]));
  })
  .catch(e => {
    return axios.get(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(BMKG_PUBLIC_API)}`)
      .then(res => {
        const allPorts = Array.isArray(res.data) ? res.data : Object.values(res.data);
        console.log(JSON.stringify(allPorts[0]));
      })
  })
  .catch(e => console.error(e.message));
