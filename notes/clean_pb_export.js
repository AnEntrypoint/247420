let recurse = a=>{
    for(x in a) {
        if(!a[x]) delete a[x]
        else if(typeof a[x] == 'object') {
            a[x]=recurse(a[x])
            let length = 0;
            for(i in a[x]) length++;
            if(!length) delete a[x];
        }
        
    }
    
    return a;
}
table.schema = table.schema.map(recurse)