import type App from "@/Utils/Classes/App.ts";
import type { CreateRoute } from "@/Utils/Classes/Route.ts";
import Route from "@/Utils/Classes/Route.ts";

export default class Test extends Route {
    public constructor(App: App) {
        super(App);
        
        this.Route = [
            {
                Method: "get",
                Path: "/",
                ContentTypes: []
            }
        ]
    }
    
    public override Request(req: CreateRoute) {        
        return "Hello World!";
    }
}
