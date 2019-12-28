export class leaseTerminationByTenant {

  activate(model){
    model.init(this);
  }

  initCreate(){
  }

  initEdit(){
  }

  attached(){
    this._setTerminableAt();

    this.observe([this.doc, 'is_furnished'], [this.doc, 'entry_date'], [this.doc, 'term_reason'],  val => {
      this._setTerminableAt();
    })
  }

  _setTerminableAt(){
    //TODO: how to set entry_date as the init value instead of current date!?
    let terminable_at = moment();
    if(this.doc.is_furnished) {// 14 days for furnished appartments
      let terminableInDays = 14
      terminable_at.add(terminableInDays, 'days');
      this.doc.terminable_at = terminable_at.format("YYYY-MM-DD");
      return;
    }
    if(this.doc.term_reason == 'normal')//by not-normal termination no min termination time needed
    {
      let temrinationInMonths = 3
      let d;
      d = { years: 0, months: temrinationInMonths, days: 0 };
      this.doc.min_duration = d;
      terminable_at.add(temrinationInMonths, 'months');
    }
    this.doc.terminable_at = terminable_at.format("YYYY-MM-DD");
  }
}
