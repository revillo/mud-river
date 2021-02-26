import('@dimforge/rapier3d').then(RAPIER =>{
    window.RAPIER = RAPIER;
    window.dispatchEvent(new Event('RAPIER'));
});
