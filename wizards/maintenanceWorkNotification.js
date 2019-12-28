export class MaintenanceWorkNotification {
  terminable_at = null;

  activate(model){
    model.init(this);
  }

  initCreate(){
    this.terminable_at = moment();
  }

  initEdit(){
  }

  attached(){
    this._setTerminableAt();
  }

  _setTerminableAt(){
    this.terminable_at = moment();
    let temrinationInMonths = 3;//legal min period to inform the tenant
    this.terminable_at.add(temrinationInMonths, 'months');
    this.doc.terminable_at = this.terminable_at.format("YYYY-MM-DD");
  }

}
