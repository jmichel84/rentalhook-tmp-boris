export class LeaseTerminationByLessor {

  activate(model){
    model.init(this);
  }

  initCreate(){
  }

  initEdit(){
  }

  attached(){
    this._setTerminableAt();

    this.observe([this.doc, 'is_furnished'], [this.doc, 'lease_effective_at'],  val => {
      this._setTerminableAt();
    })

    this.observe([this.doc, 'is_furnished'], val => {
      let d;
      if(val == true) d = { years: 0, months: 0, days: 14 };
      Object.assign(this.doc.min_duration, d);
    })

    this.observe([this.doc, 'termination_reason'], val => {
      if(val != 'host_relative')            this.doc.relative_moving_in = undefined;
      if(val != 'sale')                     this.doc.terms_of_sale = undefined;
      if(val != 'other_legitimate_reason')  this.doc.other_legitimate_reason = undefined;
    })
  }

  _setTerminableAt(){
    const today = moment().format("YYYY-MM-DD")+'T00:00:00.000Z';
    let terminable_at = moment();

    if(this.doc.is_furnished) {
      let terminableInDays = 14
      terminable_at.add(terminableInDays, 'days');
      this.doc.terminable_at = terminable_at.format("YYYY-MM-DD");
      return;
    }

    let diffInYears = moment().diff(this.doc.lease_effective_at, 'years');

    let temrinationInMonths = 3
    if(diffInYears >= 5)
    {
      temrinationInMonths = 6
      if(diffInYears >= 8)
      {
        temrinationInMonths = 9
      }
    }

    let d;
    d = { years: 0, months: temrinationInMonths, days: 0 };
    this.doc.min_duration = d;

    terminable_at.add(temrinationInMonths, 'months');
    this.doc.terminable_at = terminable_at.format("YYYY-MM-DD");
  }

}
