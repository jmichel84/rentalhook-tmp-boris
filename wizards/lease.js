export class Lease {
  is_city_in_tense_area = false;

  activate(model){
    model.init(this);
  }

  initCreate(){
    if(!this.doc.address)                  this.doc.address = {};
    if(!this.doc.duration)                 this.doc.duration = { years: 1, months: 0, days: 0 };
    if(!this.doc.service_charges_billing)  this.doc.service_charges_billing = 'upfront';
    if(!this.doc.is_rented_past_18_months) this.doc.is_rented_past_18_months = false;
    if(!this.doc.mode)                     this.doc.mode = 'standard';
    if(!this.doc.is_collective)            this.doc.is_collective = this.doc.building_type == 'house' ? false : null;
    if(!this.doc.tenants)                  this.doc.tenants = []; // for collection observer
    if(!this.doc.lessors)                  this.doc.lessors = []; // for iterator
    if(!this.doc.is_tense_area)            this.doc.is_tense_area = this.is_city_in_tense_area = this.isRentControlled(this.doc.address);
  }

  initEdit(){
    this.is_city_in_tense_area = this.isRentControlled(this.doc.address);
  }

  attached(){

     this.observe([this.doc, 'effective_at'], val => {
     // nécessaire seulement pour les logements vides et pour les contrats de moins de 3 ans
       if(this.doc.is_furnished || this.doc.duration.years >= 3){
         this.doc.short_duration_reason = null;
       }
     })

     this.observe([this.doc.address, 'formatted_address'], val => {
       this.doc.is_tense_area = this.is_city_in_tense_area = this.isRentControlled(this.doc.address);
     })

     this.observe([this.doc, 'extent'], val => {
       if(val == 'whole'){
         this.doc.bedroom_living_area = null;
         this.doc.number_persons_shared = null;
         this.doc.bedroom_location = null;
         this.doc.shared_rooms = null;
       }
    })

     this.observe([this.doc, 'heating_mode'], val => {
       if(val == 'individual') this.doc.collective_heating_repartition = null;
     })

     this.observe([this.doc, 'water_heating_mode'], val => {
       if(val == 'individual') this.doc.collective_water_heating_repartition = null;
     })

     this.observe([this.doc, 'building_type'], val => {
       this.doc.is_collective = this.doc.building_type == 'house' ? false : null;
     })

     this.observe([this.doc, 'is_rented_past_18_months'], val => {
       if(val  == false){
         this.doc.rent_from_previous_tenant = null;
         this.doc.previous_tenant_paid_at = null;
         this.doc.previous_rent_adjusted_at = null;
         this.doc.is_last_rent_adjusted = null;
       }
     })

     this.observe([this.doc, 'is_last_rent_adjusted'], val => {
       if(val == false) this.doc.previous_rent_adjusted_at = null;
     })

     this.observe([this.doc, 'rent'], val => {
       if(this.doc.is_furnished)   this.doc.deposit = this.doc.rent * 2;
       else                        this.doc.deposit = this.doc.rent;
     })

    // --------------------------------------------------------------------------------------------

    // Watch changes on lessors to set the property 'this.areAllLessorsNaturalPersons' accordingly

     var computeAreAllLessorsNaturalPersons = () => {
       let noLegalEntities = this.doc.lessors.find(lessor => lessor.lessor_type == 'legalEntity') == undefined;
       if(noLegalEntities){
         this.areAllLessorsNaturalPersons = true;
         this.doc.all_lessors_natural_persons_or_family_sci = true;
       }else{
         this.areAllLessorsNaturalPersons = false;
         this.doc.all_lessors_natural_persons_or_family_sci = null;
       }
     }

     var subscribeLessor = (lessor) => {
       this.observe([lessor, 'lessor_type'], val => {
         computeAreAllLessorsNaturalPersons()
       })
     }

   if(this.doc.all_lessors_natural_persons_or_family_sci == null) computeAreAllLessorsNaturalPersons();

    this.doc.lessors.forEach(lessor => subscribeLessor(lessor));

   this.observe([this.doc, 'lessors'], val => {
     computeAreAllLessorsNaturalPersons()
     if(val[0].addedCount) subscribeLessor(this.doc.lessors[val[0].index]);
   })

    // --------------------------------------------------------------------------------------------

    // Les charges locatives forfaitaires (flat) ne sont pas possibles pour les
    // logements loués vides n'étant pas des colocations

   this.observe([this.doc, 'is_furnished'], [this.doc, 'tenants'], val => {
     if(this.doc.is_furnished == false && this.doc.tenants.length < 2){
       this.doc.service_charges_billing = 'upfront' // passage en charges réelles
     }
   })

    // --------------------------------------------------------------------------------------------

    // set the lease duration to the right value

     this.observe([this.doc, 'mode'], [this.doc, 'is_furnished'], [this.doc, 'all_lessors_natural_persons_or_family_sci'], val => {
       let d;
       if(this.doc.is_furnished){
         if(this.doc.mode == 'student')                          d = { years: 0, months: 9, days: 0 }; // 9 mois pour bail étudiant meublé
         else                                                    d = { years: 1, months: 0, days: 0 }; // 1 an pour bail classique meublé
       }else{
         if(this.doc.all_lessors_natural_persons_or_family_sci)  d = { years: 3, months: 0, days: 0 }; // 3 ans pour bail non-meublé
         else                                                    d = { years: 6, months: 0, days: 0 }; // 6 ans pour bail commercial
       }
       Object.assign(this.doc.duration, d);
     })
   }


  isRentControlled(address) {
    if(
      address == null
      || address.address_components == null
      || address.address_components.city == null
    ) return false;
    return this.resources.rentControlledCities.some(c => c.city.toUpperCase() == address.address_components.city.toUpperCase());
  }


}
