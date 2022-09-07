# The route template snippet 

```json
{
	"Route Template": {
		"scope": "javascript",
		"prefix": "route",
		"body": [
			"/**\n * @typedef {Object} ExportObject\n * @property {String} path The path the user will access the run function at\n * @property {'get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE'} [method] The method the user requires\n * @property {('get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE')[]} [methods] The method the user requires\n * @property {Function[]} middleWare The middleware functions\n * @property {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {}} run The Req, Res and Next Functions \n */",
			"\n",
			"/**\n * @type {ExportObject}\n */",
			"module.exports = {\n    path: '$1',\n    method: '${2:get}',\n    middleWare: [],\n    run: async (req, res, next) => {\n        res.send('${0:Hello World}')\n    }\n}"
		],
		"description": "Make a new Route"
	}
}
```