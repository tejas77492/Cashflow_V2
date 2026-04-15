async function test() {
  const loginRes = await fetch("http://127.0.0.1:5000/api/auth/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email: "admin@cashflow.com", password: "Admin@123"})
  });
  if (loginRes.status === 404) {
    console.log("Login 404, maybe endpoint is /login?");
    const loginRes2 = await fetch("http://127.0.0.1:5000/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: "admin@cashflow.com", password: "Admin@123"})
    });
    const loginData2 = await loginRes2.json();
    console.log("Login2:", loginData2);
    token = loginData2.token;
  } else {
    const loginData = await loginRes.json();
    console.log("Login:", loginData);
    token = loginData.token;
  }

  const branchRes = await fetch("http://127.0.0.1:5000/api/branches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({name: "Test Branch", status: "active"})
  });
  console.log("Status:", branchRes.status);
  console.log("Create Branch:", await branchRes.text());
}
test();
