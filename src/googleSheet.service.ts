import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";

export default class GoogleSheetService {
    private _googleSheet: GoogleSpreadsheet;
    private _sheet: GoogleSpreadsheetWorksheet;

    constructor(id: string, serviceEmail: string, servicePrivateKey: string) {
        this._googleSheet = new GoogleSpreadsheet(id);
        this.setup(serviceEmail, servicePrivateKey);
    }

    setup = async (serviceEmail: string, servicePrivateKey: string) => {
        await this._googleSheet.useServiceAccountAuth({
            client_email: serviceEmail,
            private_key: servicePrivateKey
        });
        await this._googleSheet.loadInfo();  
    };

    public get googleSheet(): GoogleSpreadsheet {
        return this._googleSheet;
    }
}