const Collision = {
    PLAYER : 0,
    STATIC : 1,
    DYNAMIC : 2,
    GAZE : 3,
    CULL : 4,
    INTERACT : 5
}

Collision.getCollisionGroups = function(myGroups, interactGroups)
{
    var result = 0;
    for (let g of myGroups)
    {
        result += (1 << g);
    }
    result = result << 16;
    
    for (let f of interactGroups)
    {
        result += (1 << f);
    }
    return result;
}

export {Collision}