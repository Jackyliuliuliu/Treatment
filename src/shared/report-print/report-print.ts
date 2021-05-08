

export class ReportPrint {

    public DisplayPrintPreview(data: string, win: Window): void {
        this.showPrintQueueViewPage(data, win);
    }

    private showPrintQueueViewPage(data: string, win: Window): void{
        if(data){
            const response = JSON.parse(data);
            if(response.printViewPage){
                //window.open(response.printViewPage);
                win.location.href = response.printViewPage;
            }
        }
    }

    private showPrintPreview(pdfBase64Data: string): void {
        const element = document.getElementById('txPrintFrame');
        if (element) {
            document.body.removeChild(element);
        }
        const iframe = document.createElement('IFRAME') as HTMLIFrameElement;
        const blob = this.b64toBlob(pdfBase64Data, 'application/pdf', 1024);
        iframe.src = URL.createObjectURL(blob);
        iframe.id = 'txPrintFrame';
        iframe.frameBorder = '0';
        iframe.hidden = true;
        document.body.appendChild(iframe);
        iframe.contentWindow.print();
    }

    private b64toBlob(b64Data: string, contentType: string, sliceSize: number): Blob {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }

}
