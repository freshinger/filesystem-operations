export class FormValidationResponse {
  private _IsInvalid: boolean;
  private _ErrorMessages: string[];

  constructor(IsInvalid: boolean = false, ErrorMessages: string[] = []) {
    this._IsInvalid = IsInvalid;
    this._ErrorMessages = ErrorMessages;
  }

  get IsInvalid() {
    return this._IsInvalid;
  }

  public set IsInvalid(IsInvalid: boolean) {
    this._IsInvalid = IsInvalid;
  }

  addMessage(message: string) {
    this.ErrorMessages.push(message);
    this.IsInvalid = true;
  }

  public get ErrorMessages(): string[] {
    return this._ErrorMessages;
  }

  set ErrorMessages(ErrorMessages: string[]) {
    this._ErrorMessages = ErrorMessages;
  }
}
