exports.definition = {
  mixinCallback: function(){
    this.scope('extjs', function(params){
      //start limit
      if(params.start || params.limit){
        var limit = params.limit || 100;
        var offset = params.start || 0;        
        this.limit(parseInt(limit, 10), parseInt(offset, 10));
      }
      
      //sort
      if(params.sort){
        var order;
        
        try{
          order = JSON.parse(params['sort']);
        }catch(e){
          order = [];
        }
        
        if (!(order instanceof Array)){
          order = [order];
        }
        for(var i = 0; i < order.length; i++){
          var prop = order[i].property;
          if (prop){
            var desc = order[i].direction.toLowerCase() == 'desc';
            
            if(prop.indexOf('.') === -1){
              prop = this.definition.table_name + '.' + prop;
            }
            
            this.order(prop, desc);
          }  
        } 
      }
      //finally sort by id
      this.order(this.definition.table_name + '.id');
      
      
      //combobox query
      if(params.query){
        var attributes = this.definition.attributes;
        var conditions = {};
        
        for(var name in attributes){
          if(attributes.hasOwnProperty(name)){
            if(attributes[name].type.name === 'string'){
              conditions[name + '_ilike'] = params.query;
              break;
            }
          }
        }
        this.where(conditions);
      }
      
      
      //filter
      if(params.filter){
        var filter = params.filter;
        try{
          params.filter = JSON.parse(params['filter']);
        }catch(e){
          params.filter = filter;
        }
        var conditions = {};
        var attributes = this.definition.attributes;

        for(var i = 0; i < params.filter.length; i++){
          if(!params.filter[i].field || !params.filter[i].data) continue;
          var attribute = params.filter[i].field;
          var type = params.filter[i].data.type;
          var comp_fallback = type == 'string' ? 'ilike' : 'eq';
          var comparison = params.filter[i].data.comparison || comp_fallback;
          var value = params.filter[i].data.value;
                    
          
          var tmp = attribute.split('.');
          if(tmp.length === 1){
            if(attributes[attribute]){
              //TODO: check type
              if (type == 'time'){
                this.where("date_part(?, "+attribute+") = ?", comparison, value);
              } else {
                var name = attribute;
            
                if(comparison != 'eq'){
                  name += '_' + comparison;
                }
            
                conditions[name] = value;
              }
            }
          }else{
            var model = this;
            var cond = conditions;
            var found = false;
            attribute = tmp[tmp.length -1]
            
            for(var i = 0; i < tmp.length - 1; i++){
              var relation = model.definition.relations[tmp[i]];
              if(relation && relation.model){
                model = relation.model;
                cond[tmp[i]] = {};
                cond = cond[tmp[i]];
                found = true;
              }else{
                found = false;
              }
            }
            
            if(found){
              if (type == 'time'){
                if (model.definition.attributes[attribute]){
                  this.where("date_part(?, "+tmp[tmp.length -2]+"."+attribute+") = ?", comparison, value); 
                }
              } else {
                var name = attribute;
            
                if(comparison != 'eq'){
                  name += '_' + comparison;
                }
            
                cond[name] = value;
              }
            }
          }
        }
        
        this.where(conditions);
        
      }      
      
    });
  }
}