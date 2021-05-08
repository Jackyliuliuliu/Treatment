import * as generated from "./serviceClients";
import { AppAuthorization} from '@shared/Permission/AppAuthorization';
export class ServiceBase {
    protected transformOptions(options: any) {
        // TODO: Change options if required
        const token = AppAuthorization.getToken();
        if (token) {
            options.headers = options.headers.set('Authorization', 'Bearer ' + token);
        }
        return Promise.resolve(options);
    }
}