export function prune(obj)
{
    for (var k in obj)
    {
        if(obj[k] == undefined) delete obj[k];
    }
}

