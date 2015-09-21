var loadSaved = false;

const choixToMatrice = {
  textures: ['jean', 'diamant', 'fibre', 'eau', 'satin', 'coton', 'peche', 'petale', 'boules'],
  gouts: ['swetty', 'sour', 'salty', 'bitter'],
  lieux: ['interieur', 'interieur', 'exterieur', 'exterieur', 'exterieur', 'exterieur', 'interieur', 'interieur'],
  sons: ['pluie', 'rue', 'tubularbell', 'mer', 'oiseaux', 'restaurant'],
}

function convertChoix(m) {
  return {
    color: m.couleur,
    texture: choixToMatrice.textures[m.texture],
    taste: choixToMatrice.gouts[m.gout],
    place: choixToMatrice.lieux[m.lieu],
    light: (m.lum > 0.5) ? 'nuit' : 'jour',
    gender: m.genre,
    sound: choixToMatrice.sons[m.son],
  }
}


function reco(choix) {

  var matrice = convertChoix(choix);

  console.log("*******************************\n Choix de l'utilisateur : \n ", matrice);

  //vérifie si tous les choix sont effectué
  var c;
  for (c in matrice) {
    if (typeof matrice[c] == 'undefined') {
      return false;
    }
  }

  //appel ajax vers l'algo de reco
  $.get(
    "http://130.211.51.163:8080", {
      matrice: JSON.stringify(matrice)
    }).done(function (data) {
    console.log("retour de l'algo ", data);
    var parfums = JSON.parse(data);
    updateParfum([{
      name: parfums[0].name,
      house: parfums[0].brand,
      price: parfums[0].price,
      src: parfums[0].thumb,
      capacity: ['2L', '25cl'] // ne figure pas dans les retour de l'algo et figure pourtant sur la page reco.....
    }, {
      name: parfums[1].name,
      house: parfums[1].brand,
      price: parfums[1].price,
      src: parfums[1].thumb,
      capacity: ['2L', '25cl'] // ne figure pas dans les retour de l'algo et figure pourtant sur la page reco.....
    }, {
      name: parfums[2].name,
      house: parfums[2].brand,
      price: parfums[2].price,
      src: parfums[2].thumb,
      capacity: ['2L', '25cl'] // ne figure pas dans les retour de l'algo et figure pourtant sur la page reco.....
    }])
  });
}


/**
 * [updateParfum modifie les valeurs et images des parfums sur la page reco]
 * @param  {array of JSON} parfums [tableau contenant le JSON contenant les infos des trois parfums
 *                                   [{name: string,
 *                                     house : string,
 *                                     price : string,
 *                                     img : url,
 *                                     capacity : array [string,string,stinrg.....]}]
 */
function updateParfum(parfums) {

  console.log('Update');
  const idPrefix = ['#first-scent-', '#second-scent-', '#third-scent-']
  var c, d;
  console.log('parfums');
  for (c in parfums) {
    //nom
    $(idPrefix[c] + 'name-preview').html(parfums[c].name);
    $(idPrefix[c] + 'name').html(parfums[c].name);
    //marque
    $(idPrefix[c] + 'house-preview').html(parfums[c].house);
    $(idPrefix[c] + 'house').html(parfums[c].house);
    //prix
    $(idPrefix[c] + 'prize-preview').html(parfums[c].price);
    $(idPrefix[c] + 'prize').html(parfums[c].price);
    //image
    $(idPrefix[c] + 'img-preview img').attr('src', parfums[c].src);
    $(idPrefix[c] + 'img img').attr('src', parfums[c].src);
    //capacité
    $(idPrefix[c] + 'capacity-preview').html('');
    $(idPrefix[c] + 'capacity').html('');
    for (d in parfums[c].capacity) {
      $(idPrefix[c] + 'capacity-preview').append('<option value="' + parfums[c].capacity[d] + '">' + parfums[c].capacity[d] + '</option>');
      $(idPrefix[c] + 'capacity').append('<option value="' + parfums[c].capacity[d] + '">' + parfums[c].capacity[d] + '</option>');
    }
  }
}

/**
 *
 *	Pour retrouver des choix précédemment enregistré, soit par un identifiant de l'utilisateur et
 *	un appel ajax pour retrouver les infos lié à cet identifiant
 *	soit directements envoyé dans l'url accessible dans l'objet params
 *
 * [loadDiagnostic appellé si l'url comporte ?id=x où dans l'idée x serait un identifiant de l'utilisateur]
 * @param  {[array]} params [les valeur passé en url]
 *
 */
function loadDiagnostic(params) {
  loadSaved = true; //pour éviter que la mise à jour des choix rappelle la fonction reco et donc relance l'algo

  // pour test
  var choixSaved = {
    texture: 3,
    couleur: ['rgb(120,25,45)', 'rgb(255,0,0)', 'rgb(0,255,0)'],
    lieu: 5,
    son: 2,
    gout: 3,
    genre: 'woman'
  }

  //mise à jour des choix pour que l'auragramme s'adapte
  Choix.change('texture', choixSaved.texture);
  Choix.change('couleur', choixSaved.couleur[0], choixSaved.couleur[1], choixSaved.couleur[2]);
  Choix.change('lieu', choixSaved.lieu);
  Choix.change('son', choixSaved.son);
  Choix.change('gout', choixSaved.gout);
  Choix.change('genre', choixSaved.genre);


  //relance de la mise à jour de l'affichage des parfums proposé
  updateParfum([{
    name: 'Nom',
    house: 'Marque',
    price: '125',
    src: 'images/peau_peche2.jpg',
    capacity: ['2L', '25cl']
  }, {
    name: 'TrucBidule',
    house: 'Choupi',
    price: '1.5',
    src: 'images/petal_diff.jpg',
    capacity: ['2L', '25cl', '50kL']
  }, {
    name: 'Flop',
    house: 'Coucou',
    price: '125',
    src: 'images/intro.jpg',
    capacity: ['2L', '25cl']
  }])


  xp_encours = 6;
  XPs = new AuraGramme('#renderer', null);
  XPs.init();
}

/**
 *	appel ajax pour sauvegarder les choix/resultat de la reco (disponilbe dans l'objet Choix)
 *
 * [saveDiagnostic appelée au clic sur la page reco]
 * @return {[type]} [description]
 */
function saveDiagnostic() {
  console.log(Choix);
}