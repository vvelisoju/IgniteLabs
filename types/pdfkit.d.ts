declare module 'pdfkit' {
  interface PDFDocumentOptions {
    margin?: number | { top?: number; left?: number; bottom?: number; right?: number };
    size?: string | [number, number];
    autoFirstPage?: boolean;
    layout?: 'portrait' | 'landscape';
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
    };
    pdfVersion?: string;
    compress?: boolean;
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: 'lowResolution' | 'highResolution';
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
      fillingForms?: boolean;
      contentAccessibility?: boolean;
      documentAssembly?: boolean;
    };
    bufferPages?: boolean;
    font?: string;
    fontSize?: number;
    lineBreak?: boolean;
    pageAdding?: boolean;
  }

  interface TextOptions {
    align?: 'left' | 'center' | 'right' | 'justify';
    width?: number;
    height?: number;
    wordSpacing?: number;
    characterSpacing?: number;
    fill?: boolean;
    stroke?: boolean;
    underline?: boolean;
    indent?: number;
    paragraphGap?: number;
    lineGap?: number;
    columns?: number;
    columnGap?: number;
    continued?: boolean;
    ellipsis?: string | true;
    features?: any[];
  }

  interface ImageOptions {
    width?: number;
    height?: number;
    scale?: number;
    fit?: [number, number];
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'center' | 'bottom';
  }

  export class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    addPage(options?: PDFDocumentOptions): this;
    pipe(destination: NodeJS.WritableStream): this;
    font(src: string, family?: string): this;
    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    image(src: string | Buffer, x?: number, y?: number, options?: ImageOptions): this;
    end(): this;
    on(event: string, callback: (...args: any[]) => void): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    fill(color?: string): this;
    fillColor(color: string): this;
    fillAndStroke(fillColor?: string, strokeColor?: string): this;
    rect(x: number, y: number, width: number, height: number): this;
  }

  export default PDFDocument;
}