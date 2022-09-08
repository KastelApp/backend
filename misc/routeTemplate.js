new Route(__dirname, "/hello", "GET", async (req, res) => {
    res.send("Hello World")
})