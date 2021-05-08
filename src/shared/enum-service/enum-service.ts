import { Injectable} from '@angular/core';
import { EnumServiceProxy } from '@shared/service-proxies/service-proxies';

@Injectable()
export class EnumMapsService {

    totalDictionary: { [key: string]: { [key: string]: number; }; }

    constructor(private _enumServiceProxy: EnumServiceProxy) {
        if(this.totalDictionary == null){
            console.log("initial totalDictionary");
            this.initEnumMapsService();
        }
        else{
            console.log("totalDictionary is not null.");
        }
        
    }

    private initEnumMapsService() {
        this._enumServiceProxy.getAllMaps()
            .pipe()
            .subscribe(data => {
                var allMaps = data;
                this.getAllMaps(allMaps);
            });

    }




    getEnumValue(enumType: string, enumInt: number) {
        for (let key in this.totalDictionary) {
            if (key == enumType) {
                var selectedEnumDic = this.totalDictionary[key];
                for (let k in selectedEnumDic) {
                    if (selectedEnumDic[k] == enumInt) {
                        return k;
                    }
                }
            }
        }

    }

    getEnumInt(enumType: string, value: string) {
        for (let key in this.totalDictionary) {
            if (key == enumType) {
                var selectedEnumDic = this.totalDictionary[key];
                for (let k in selectedEnumDic) {
                    if (k == value) {
                        return k;
                    }

                }
            }

        }

    }

    getEnumMap(enumType: string) {
        for (let t in this.totalDictionary) {
            if (t == enumType) {
                return this.totalDictionary[t];
            }
        }

    }

    getAllMaps(totalDic: { [key: string]: { [key: string]: number; }; }) {
        console.log("Get All Enum Maps.");
        this.totalDictionary = totalDic;
    }
} 