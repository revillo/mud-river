export function merge(objDest, objSrc)
{
    var fuseHelper = function(a, b)
    {
        if (a instanceof Array && b instanceof Array)
        {
            a.push(...b);
        }
        if (a instanceof Object && b instanceof Object)
        {
            for (var prop in b)
            {
                if (a[prop])
                fuseHelper(a[prop], b[prop]);
                else
                a[prop] = b[prop];
            }
        }
    }

    fuseHelper(objDest, objSrc);
}