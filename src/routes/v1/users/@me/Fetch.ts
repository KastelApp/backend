import { Route } from '@kastelll/packages';

new Route('/', 'GET', [], async (req, res) => {
    res.send('Works!')
})