export class AppAuthorization {
    /**
     *  setToken
token:string     */
    public static setToken(token: string) {
        window.sessionStorage.setItem('Authorization', token);
    }

    /**
     * getToken
 : string    */
    public static getToken(): string {
        return window.sessionStorage.getItem('Authorization');
    }
}
