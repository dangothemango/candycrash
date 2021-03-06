var PlayState = {

	preload: function(){
		game.load.atlasJSONHash('submitButton', 'assets/images/buttons/done_buttons.png','assets/images/buttons/done_buttons.json');
        game.load.atlas('items', 'assets/images/items.png', 'assets/images/items.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        game.load.image('cauldron', 'assets/images/cauldron alt.png');
        game.load.image('bg', 'assets/images/background vector.png');
        game.load.atlasJSONHash('right_arrow', 'assets/images/rightarrow.png', 'assets/images/rightarrow.json');
        game.load.atlasJSONHash('left_arrow', 'assets/images/leftarrow.png', 'assets/images/leftarrow.json');
        game.load.image('notFound','assets/images/notfoundicon.png');
        game.load.image('blank','assets/images/empty.png');
        game.load.spritesheet('bookNoShit','assets/images/closedBook_noBlueShit desaturated.png',449,327,13);
        game.load.spritesheet('bubbles','assets/images/bubbles.png',892,319,6);
        game.load.spritesheet('sploosh','assets/images/sploosh.png',907,461,7);
        game.load.spritesheet('smoke','assets/images/smoke.png',418,513,7);
        game.load.image('bookScreen','assets/images/flat_book_desaturated.png');
        game.load.atlas('candy','assets/images/candy/candysheet.png','assets/images/candy/candysheet.json',Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);

        //sound
        game.load.audio('dm_soundeffect', 'assets/sounds/addDarkmatter.wav');
        game.load.audio('liquid_soundeffect', 'assets/sounds/addLiquid.wav');
        game.load.audio('powder_soundeffect', 'assets/sounds/addPowder.wav');
        game.load.audio('solid_soundeffect', 'assets/sounds/addSolid.wav');
	},

	winState: null,

	levelNum: 0 ,

	won: false,

	create: function () {

		//cheat code key for development
		nextLevelKey = game.input.keyboard.addKey(Phaser.Keyboard.N);

	    PlayState.reset_all();

	    //skip to level using debug, doenst effect cutscenes
	    if (debug){
	    	for (var i =0; i<=debugLevel; i++){
	    		PlayState.unlock_items(i);
	    	}
	    	PlayState.winState=WinConditions[debugLevel];
	    } else{
    	    PlayState.winState=WinConditions[this.levelNum];
    
    	    if (!PlayState.won) PlayState.unlock_items(this.levelNum);
    	}

	    console.log("Play State");

	    //our game had crabs, i fixed it
		//crabCount = 0;

		ing = Ingredients;

		/////////////////////

		game.add.sprite(0,0, 'bg');


		
		//soundfx
		dm_soundeffect = game.add.audio('dm_soundeffect');
		liquid_soundeffect = game.add.audio('liquid_soundeffect');
		powder_soundeffect = game.add.audio('powder_soundeffect');
		solid_soundeffect = game.add.audio('solid_soundeffect');

		cauldron = game.add.sprite(1165,560, 'cauldron');
		cauldron.anchor.set(0.5);
		cauldron.width = 325;
		cauldron.height = 325;

		closedBook = game.add.sprite(1334/2+50,525, 'bookNoShit');
		closedBook.scale.set(.5,.5);
		closedBook.animations.frame=8;
		closedBook.inputEnabled=true;
		closedBook.events.onInputDown.add(PlayState.openBook,game);
		closedBook.animations.add('idle',[9,10,11,12,0,1,2,3,4,5,6,7,8]);

		//surface of the liquid in the cauldron
        bubble_surface = game.add.sprite(1078, 460, 'bubbles');
        bubble_surface.scale.set(.19,.19);
		bubble_surface.animations.add('idle',[0,1,2,3,4,5]);
        bubble_surface.animations.play('idle',15,true);

        splash = game.add.sprite(1055, 400, 'sploosh');
        splash.scale.set(.24,.24);
		splash.animations.add('idle',[0,1,2,3,4,5,6]);
        splash.animations.frame=6;

        //smoke for reactions between ingredients
        smoke = game.add.sprite(960, 100, 'smoke');
        //smoke.scale.set(.24,.24);
		smoke.animations.add('idle',[0,1,2,3,4,5,6]);
        smoke.animations.frame=6;
		
		//group of sprites/items
		group = game.add.group();
		group.x = cornerX;
		group.y = cornerY;
		group.inputEnableChildren = true;

		//load from atlas file; sprite name|frameName
		group.createMultiple(1,'items', items_left, true);
		//resize all sprites
		group.forEach(function(sprite) {sprite.scale.set(0.5,0.5)});
		//if touched, allow drag
		group.onChildInputDown.add(_drag,this); 
		//align on shelves or something
		group.align(shelfwidth, shelfheight, itemwidth, itemheight, Phaser.CENTER);

		//paging buttons
		right_button = game.add.button(990, 200, 'right_arrow', PlayState.rightpage, this, 'Down', 'Static', 'Down', 'Down');
		left_button = game.add.button(25, 200, 'left_arrow', PlayState.leftpage, this, 'Down', 'Static', 'Down', 'Down');
		left_button.visible = false;
		if (items_right.length === 0) {
		    right_button.visible = false;
		}

		//done button
		var submit = game.add.button(1103,game.world.height - 150, 'submitButton', submitCandy, this, 'Up', 'Static', 'Down', 'Up');
		submit.width = 125;
		submit.height = 50;


        // TRACKING UI
        //game.add.sprite(995,25, 'flavorlist');
        flav1 = game.add.text(990, 26, '', uiStyle);
        flav2 = game.add.text(990, 60, '', uiStyle);
        flav3 = game.add.text(990, 94, '', uiStyle);
        flav4 = game.add.text(990, 128, '', uiStyle);
        flav5 = game.add.text(990, 162, '', uiStyle);

        attributes = game.add.text(1143, 135, '', chalkStyle);

        Book.open();
	},

	openBook: function(sprite, pointer){
		Book.open();
	},

	update: function() {

		//cheat code
		if (nextLevelKey.isDown){
			nextLevel();
		}

		//animte book when its closed
	    if (closedBook.animations.currentAnim != null && closedBook.animations.currentAnim.isPlaying){
		} else if (rand.frac()>.997){
			closedBook.animations.play('idle',15,false);
	    }


	    //attch items to pointer
	    if (dragged_item != null) {
	        dragged_item.x = game.input.activePointer.x - 70;
	        dragged_item.y = game.input.activePointer.y - 110;
	    }

	    //dropItems
	    if (game.input.activePointer.isUp && dragged_item != null) {
	        PlayState.dropHandler(dragged_item);
	    }

	    //handle cauldron contents coloring
	    if (totalIngred === 0) {
            bubble_surface.visible = false;
	    }
	    else {
            bubble_surface.visible = true;
	        bubble_surface.tint = PlayState.hexFromArray(currentColor);
            splash.tint = bubble_surface.tint;
	    }
	   
        attributes.text = "";

        //current candy information
        if (totalIngred > 0) {
            attributes.text += PlayState.colorStringFromArray(currentColor) + '\n';
        }
        attributes.text += flavors_string;
        attributes.text += effects_string;
	}, 

	reset_all: function () {
		//reset the candy and information and ingredients on the shelf
	    ingredientsInCauldron = [];
	    flavorList = [];
	    effects = [];
	    currentColor = [255, 255, 255];
	    numCol = 0;
	    totalIngred = 0;
	    sparkles=false;
	    winCondition = 0;
	    shelf_index = 0;
	    dirty = false;
        flavors_string = "";
        effects_string = "";
	},

    toTitleCase: function (str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    },

	updateFlavorUI: function () {
        if(flavorList.length>0) {
	        flav5.text=PlayState.toTitleCase(flavorList[flavorList.length-1]);
	    }
	    else {
            flav5.text='';
	    }

        if(flavorList.length>1) {
	        flav4.text=PlayState.toTitleCase(flavorList[flavorList.length-2]);
	    }

	    else {
            flav4.text='';
	    }

        if(flavorList.length>2) {
	        flav3.text=PlayState.toTitleCase(flavorList[flavorList.length-3]);
	    }
	    else {
            flav3.text='';
	    }

        if(flavorList.length>3) {
	        flav2.text=PlayState.toTitleCase(flavorList[flavorList.length-4]);
	    }
	    else {
            flav2.text='';
	    }

        if(flavorList.length>4) {
	        flav1.text=PlayState.toTitleCase(flavorList[flavorList.length-5]);
	    }
	    else {
            flav1.text='';
	    }
	},

    // let's be pretty generous with this hit detection
    // basically collision detection
	mouseOverCauldron: function () {
	    var over = false;
	    if (game.input.activePointer.x > cauldron.x - (cauldron.width / 2)) {
	        if (game.input.activePointer.y > cauldron.y - (cauldron.height)) {
	            return true;
	        }
	    }
	    return false;
	},

	mouseOverBook: function () {
	    var over = false;
	    if (game.input.activePointer.x > closedBook.x) {
	        if (game.input.activePointer.y > closedBook.y - (closedBook.height)) {
        		if (game.input.activePointer.x < closedBook.x + (closedBook.width)) {
       				if (game.input.activePointer.y < closedBook.y + (closedBook.height)) {
            			return true;
            		}
            	}
	        }
	    }
	    return false;
	},


	//functions to convert colors to other formats
	componentToHex: function(c) {
        var hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    },

	hexFromArray: function (arr) {
	    var hex = "0x" + PlayState.componentToHex(arr[0]) + PlayState.componentToHex(arr[1]) + PlayState.componentToHex(arr[2]);
	    return parseInt(hex);
	},

	hsvFromArray: function (arr) {
	    var r = arr[0]/256.0;
	    var g = arr[1]/256.0;
	    var b = arr[2]/256.0;

	    var h = 0;
	    var s = 0;
	    var v = 0;

	    var min;
	    var max;
	    var delta;

	    min = Math.min(r, g, b);
	    max = Math.max(r, g, b);
	    v = max;
	    delta = max - min;

	    if( max != 0 )
	        s = delta / max;
	    else {
	        h = 0;
	        s = 0;
	        v = 0;
	    }
	    if( r === max )
	        h = ( g - b ) / delta;
	    else if( g === max )
	        h = 2 + ( b - r ) / delta;
	    else
	        h = 4 + ( r - g ) / delta;
	    h *= 60;
	    if( h < 0 )
	        h += 360;

	    s *= 100;
	    v *= 100;

	    return [h,s,v];
	},

	colorStringFromArray: function (arr) {
	    var hsv = PlayState.hsvFromArray(arr);
	    var hue = hsv[0];
	    var sat = hsv[1];
        var val = hsv[2]

	    var col;

	    if (hue < 13){
	        col = 'Red';
	    }
	    else if (hue < 52) {
	        col = 'Orange';
	    }
	    else if (hue <= 66) {
	        col = 'Yellow';
	    }
	    else if (hue < 159) {
	        col = 'Green';
	    }
	    else if (hue < 255) {
	        col = 'Blue';
	    }
	    else if (hue < 307) {
	        col = 'Purple';
	    }
	    else {
	        col = 'Red';
	    }

	    if (val < 60){
	        if (col === 'Orange' || col === 'Yellow'){
	            col = 'Brown';
	        }
	    }

	    if (sat < 15){
            col = 'Gray';
	    }
	    if (val < 10){
	        col = 'Black';
	    }
	    if (val > 95 && sat < 5) {
	        col = 'White';
	    }

	    return col;
	},

	//semantic conversion
	amountFromNum: function (num) {
		if (num==null)return '';
		return flavorText[num];
	},

	prettyEffectFromEffect: function(effect){
		switch (effect){
	        case "dirt":
	            return "Dirt";
	        case "tentacles":
	            return "Tentacle Forming";
	        case "poison":
	            return "Poisonous";
	        case "explosive":
	            return "Explosive";
	        case "mind_control":
	            return "Mind Control";
	        case "implosion":
	            return "Implosion";
	        case "slimification":
	            return "Slimification";
	    }
	},

	dropHandler: function(item, pointer) {

		if (FinalCandy.sprite !=null){
			FinalCandy.sprite.destroy();
		}

		if (PlayState.mouseOverBook()){
			Book.open();
			Book.findIngredient(Ingredients[item.frameName].name);
		}

		//removes from group if mouse is over cauldron
	    if (PlayState.mouseOverCauldron()) {

            var playsmoke = false;
	        totalIngred += 1;
			//keep track of attributes
			// adjust main candy accordingly

	        var currentIngredient = PlayState.getIngredientFromName(item.frameName);
	        console.log('');
	        console.log("added "+currentIngredient.name);

	        // add the current ingredient to the list
	        ingredientsInCauldron.push(item.frameName);


            ///////// FLAVOR

            Ingredients[item.frameName].known.flavor=true;

            // if the item has a flavor and there's no dirt in the cauldron
	        if (currentIngredient.flavor != 'flavorless' && !dirty) {
                // put it in the list
	            flavorList.push(currentIngredient.flavor);
	            Ingredients[item.frameName].known.flavor=true;

                // if we have more than 5 flavors
	            if (flavorList.length > 5) {
                    // remove the first one
	                flavorList.splice(0, 1);
	            }
	        }

            var num_spicy = 0;
            var num_savory = 0;
            var num_sweet = 0;
            var num_salty = 0;
            var num_sour = 0;
            var num_bitter = 0;

            for (var i = 0; i < flavorList.length; i++){
                if (flavorList[i] === "spicy") {
                    num_spicy++;
                }
                if (flavorList[i] === "savory") {
                    num_savory++;
                }
                if (flavorList[i] === "sweet") {
                    num_sweet++;
                }
                if (flavorList[i] === "salty") {
                    num_salty++;
                }
                if (flavorList[i] === "sour") {
                    num_sour++;
                }
                if (flavorList[i] === "bitter") {
                    num_bitter++;
                }
            }

            flavors_string = "";

            if (num_spicy > 0){
                flavors_string += PlayState.amountFromNum(num_spicy) + " Spicy\n";
            }
            if (num_savory > 0){
                flavors_string += PlayState.amountFromNum(num_savory) + " Savory\n";
            }
            if (num_sweet > 0){
                flavors_string += PlayState.amountFromNum(num_sweet) + " Sweet\n";
            }
            if (num_salty > 0){
                flavors_string += PlayState.amountFromNum(num_salty) + " Salty\n";
            }
            if (num_sour > 0){
                flavors_string += PlayState.amountFromNum(num_sour) + " Sour\n";
            }
            if (num_bitter > 0){
                flavors_string += PlayState.amountFromNum(num_bitter) + " Bitter\n";
            }


	        ///////// COLOR
			Ingredients[item.frameName].known.color=true;
	        if (!(currentIngredient.prettycolor === 'Colorless' || currentIngredient.prettycolor === 'Sparkly') && !dirty) {
	            currentColor[0] = Math.round((currentIngredient.color[0] + currentColor[0] * numCol) / (numCol + 1));
	            currentColor[1] = Math.round((currentIngredient.color[1] + currentColor[1] * numCol) / (numCol + 1));
	            currentColor[2] = Math.round((currentIngredient.color[2] + currentColor[2] * numCol) / (numCol + 1));
	            numCol++;

	            bubble_surface.tint = PlayState.hexFromArray(currentColor);
                splash.tint = bubble_surface.tint;
	        } else if (currentIngredient.prettycolor === 'Sparkly'){
            	sparkles=true;
            }

	        ///////// EFFECTS

	        if (currentIngredient.effects.type != 'none') {

	            var effect_index = effects.indexOf(currentIngredient.effects.type);

	            if (effect_index === -1) {
	                if (currentIngredient.effects.value === 1) {
	                    effects.push(currentIngredient.effects.type);
	                    Ingredients[item.frameName].known.effects=true;
	                }
	            }
	            else {
	                if (currentIngredient.effects.value === -1) {
	                    effects.splice(effect_index, 1);
	                    Ingredients[item.frameName].known.effects=true;
	                }
	            }
	        }

	        ////////// SPECIAL ITEMS

	        if (item.frameName === 'bleach') {
	            if (!dirty){
		    	        Ingredients[item.frameName].known.effects=true;
	                currentColor = [255, 255, 255];
	                numCol = 0;
	                bubble_surface.tint = PlayState.hexFromArray(currentColor);
	                splash.tint = bubble_surface.tint;
	            }
	        }

	        if (item.frameName === 'dark_matter') {
	        	Ingredients[item.frameName].known.effects=true;
		        dm_soundeffect.play();
		        PlayState.erase_all();
                playsmoke = true;
	        }

	        if (item.frameName === 'dirt') {
	        	Ingredients[item.frameName].known.effects=true;
	        	Ingredients[item.frameName].known.flavor=true;
	            dirty = true;
	            flavorList = ['dirt', 'dirt', 'dirt', 'dirt', 'dirt'];
	            currentColor = currentIngredient.color;
	            bubble_surface.tint = PlayState.hexFromArray(currentColor);
                splash.tint = bubble_surface.tint;
                playsmoke = true;
	        }

		    //sound effects for specific items

		    switch (Ingredients[item.frameName].type){
		    	case 'solid':
			    	solid_soundeffect.play();
			    	break;
			    case 'liquid':
			    	liquid_soundeffect.play();
			    	break;
			    case 'powder':
			    	powder_soundeffect.play();
			    	break;


		    }

		    // if (item.frameName === 'bone_marrow' || item.frameName === 'caviar' || item.frameName === 'chocolate' || 
		    //     item.frameName === 'demon_flesh' ||  item.frameName === 'eye_of_newt' || item.frameName === 'frog_legs' 
		    //     || item.frameName === 'ghost_pepper' || item.frameName === 'insect_parts' || item.frameName === 'lemons' 
		    //     || item.frameName === 'leopard_spots' || item.frameName === 'lizard_eggs' || item.frameName === 'mandrake' 
		    //     || item.frameName === 'pufferfish' || item.frameName === 'tentacles' || item.frameName === 'toadstool') {

			   //  solid_soundeffect.play();
		    // }

		    // if (item.frameName === 'bleach' || item.frameName === 'blood' || item.frameName === 'cyanide' || 
		    //     item.frameName === 'liquid_smoke' || item.frameName === 'slime' || item.frameName === 'snake_venom' 
		    //     || item.frameName === 'squid_ink' || item.frameName === 'mercury') {
			   //  liquid_soundeffect.play();
		    // }

		    // if (item.frameName === 'fairy_wings' || item.frameName === 'nightshade' || item.frameName === 'dirt') {
			   //  powder_soundeffect.play();
		    // }
		    
	        ////////// REACTIONS

		    var reactant; // the other ingredient in the reaction
		    var has_reaction = false;
		    var ingredient_index;

		    //I really cant think of a simple better way to do this
		    if (item.frameName === 'cyanide') {

		        if (ingredientsInCauldron.indexOf('nightshade') != -1) {
		            reactant = 'nightshade';
		            has_reaction = true;

		            // add mind control
		            PlayState.add_mind_control();
		        }

		    }
		    else if (item.frameName === 'demon_flesh') {

		        if (ingredientsInCauldron.indexOf('fairy_wings') != -1) {
		            reactant = 'fairy_wings';
		            has_reaction = true;

		            // erase contents of cauldron
		            PlayState.erase_all();
		        }
		        else if (ingredientsInCauldron.indexOf('lemons') != -1) {
		            reactant = 'lemons';
		            has_reaction = true;

		            // remove implosion and explosion effects
		            PlayState.remove_imp_exp();
		        }

		    }
		    else if (item.frameName === 'fairy_wings') {

		        if (ingredientsInCauldron.indexOf('demon_flesh') != -1) {
		            reactant = 'demon_flesh';
		            has_reaction = true;

		            // erase contents of cauldron
		            PlayState.erase_all();
		        }

		    }
		    else if (item.frameName === 'nightshade') {

		        if (ingredientsInCauldron.indexOf('cyanide') != -1) {
		            reactant = 'cyanide';
		            has_reaction = true;

		            // add mind control
		            PlayState.add_mind_control();
		        }

		    }
		    else if (item.frameName === 'ghost_pepper') {

		        if (ingredientsInCauldron.indexOf('lemons') != -1) {
		            reactant = 'lemons';
		            has_reaction = true;

		            // remove implosion and explosion effects
		            PlayState.remove_imp_exp();
		        }

		    }
		    else if (item.frameName === 'lemons') {

		        if (ingredientsInCauldron.indexOf('demon_flesh') != -1) {
		            reactant = 'demon_flesh';
		            has_reaction = true;

		            // remove implosion and explosion effects
		            PlayState.remove_imp_exp();
		        }
		        else if (ingredientsInCauldron.indexOf('ghost_pepper') != -1) {
		            reactant = 'ghost_pepper';
		            has_reaction = true;

		            // remove implosion and explosion effects
		            PlayState.remove_imp_exp();
		        }
		        else if (ingredientsInCauldron.indexOf('liquid_smoke') != -1) {
		            reactant = 'liquid_smoke';
		            has_reaction = true;

		            // remove implosion and explosion effects
		            PlayState.remove_imp_exp();
		        }
		    }
		    else if (item.frameName === 'liquid_smoke') {

		        if (ingredientsInCauldron.indexOf('lemons') != -1) {
		            reactant = 'lemons';
		            has_reaction = true;

		            // remove implosion and explosion effects
		            PlayState.remove_imp_exp();
		        }

		    }
		    else if (item.frameName === 'snake_venom') {

		        if (ingredientsInCauldron.indexOf('squid_ink') != -1) {
		            reactant = 'squid_ink';
		            has_reaction = true;

		            // remove tentacles effect
		            PlayState.remove_tentacles();
		        }
		        else if (ingredientsInCauldron.indexOf('tentacles') != -1) {
		            reactant ='tentacles';
		            has_reaction = true;

		            // remove tentacles effect
		            PlayState.remove_tentacles();
		        }

		    }
		    else if (item.frameName === 'squid_ink') {

		        if (ingredientsInCauldron.indexOf('snake_venom') != -1) {
		            reactant = 'snake_venom';
		            has_reaction = true;

		            // remove tentacles effect
		            PlayState.remove_tentacles();
		        }

		    }
		    else if (item.frameName === 'tentacles') {

		        if (ingredientsInCauldron.indexOf('snake_venom') != -1) {
		            reactant = 'snake_venom';
		            has_reaction = true;

		            // remove tentacles effect
		            PlayState.remove_tentacles();
		        }

		    }


		    if (has_reaction) {
                playsmoke = true;
		        // stop tracking both of the ingredients so we don't get the same effect again
		        // note that the reaction might have erased everything already
		        if (ingredientsInCauldron.length > 0) {
		            ingredient_index = ingredientsInCauldron.indexOf(reactant);

                    ingredientsInCauldron.splice(ingredient_index, 1);
                    ingredientsInCauldron.splice(ingredientsInCauldron.length - 1, 1);
		        }

		        console.log("REACTION BETWEEN " + item.frameName + " AND " + reactant);
		        var r1 = game.add.sprite(1068, 315, 'items', item.frameName);
		        var r2 = game.add.sprite(1168, 315, 'items', reactant);
		        r1.scale.set(0.4, 0.4);
		        r2.scale.set(0.4, 0.4);

		        game.time.events.add(Phaser.Timer.SECOND*1.5, function (image){ PlayState.delete_reaction_sprites(r1, r2)}, this);
		    }

            PlayState.updateFlavorUI();

            effects_string = "";
            for (var i = 0; i < effects.length; i++){
                effects_string += PlayState.prettyEffectFromEffect(effects[i])+"\n";
            }

	        if(playsmoke) {
                smoke.animations.play('idle',12,false);
	        }
	        else {
	            splash.animations.play('idle',15,false);
	        }
	    }

		item.destroy();
		dragged_item = null;
	},

	delete_reaction_sprites: function (sprite1, sprite2) {
	    sprite1.destroy();
	    sprite2.destroy();
	},

	erase_all: function () {
		//like reset all but
		bubble_surface.alpha=1;
		bubble_surface.visible = false;
	    ingredientsInCauldron = [];
	    flavorList = [];
	    effects = [];
	    sparkles=false;
	    currentColor = [255, 255, 255];
	    numCol = 0;
	    totalIngred = 0;
	    dirty = false;
	    bubble_surface.tint = PlayState.hexFromArray(currentColor);
        splash.tint = bubble_surface.tint;
        flavors_string = "";
        effects_string = "";
        flav1.text = "";
        flav2.text = "";
        flav3.text = "";
        flav4.text = "";
        flav5.text = "";
	},

	add_mind_control: function () {
	    var mind_index = effects.indexOf('mind_control');

	    if (mind_index === -1) {
	        effects.push('mind_control');
	    }
	},

	//remove implosion and explosion effects
	remove_imp_exp: function () {
	    var imp_index = effects.indexOf('implosion');
	    var exp_index = effects.indexOf('explosive');

	    if (imp_index != -1 && exp_index != -1) {
	        effects.splice(imp_index, 1);
	        effects.splice(exp_index, 1);
	    }
	},

	remove_tentacles: function () {
	    var tent_index = effects.indexOf('tentacles');

	    if (tent_index != -1) {
	        effects.splice(tent_index, 1);
	    }
	},

	rightpage: function () {
	    if (shelf_index === 0) {

	        group.destroy();

	        group = game.add.group();
	        group.x = cornerX;
	        group.y = cornerY;
	        group.inputEnableChildren = true;
            
	        //load from atlas file; sprite name|frameName
	        group.createMultiple(1, 'items', items_right, true);
	        //resize all sprites
	        group.forEach(function (sprite) { sprite.scale.set(0.5, 0.5) });
	        //if touched, allow drag
	        group.onChildInputDown.add(_drag, this);
	        //align on shelves or something
	        group.align(shelfwidth, shelfheight, itemwidth, itemheight, Phaser.CENTER);

	        right_button.visible = false;
	        left_button.visible = true;
	        shelf_index = 1;
	    }
	},

	leftpage: function () {
	    if (shelf_index === 1) {
	        group.destroy();

	        group = game.add.group();
	        group.x = cornerX;
	        group.y = cornerY;
	        group.inputEnableChildren = true;

	        //load from atlas file; sprite name|frameName
	        group.createMultiple(1, 'items', items_left, true);
	        //resize all sprites
	        group.forEach(function (sprite) { sprite.scale.set(0.5, 0.5) });
	        //if touched, allow drag
	        group.onChildInputDown.add(_drag, this);
	        //align on shelves or something
	        group.align(shelfwidth, shelfheight, itemwidth, itemheight, Phaser.CENTER);

	        right_button.visible = true;
	        left_button.visible = false;
	        shelf_index = 0;
	    }
	},

	unlock_items: function (level) {
	    if (level === 0){
	        add_item('dark_matter');
	        add_item('bleach');
	        add_item('chocolate');
	        add_item('cyanide');
	        add_item('eye_of_newt');
	        add_item('dirt');
	    }
	    if (level === 1) {
	        add_item('blood');
	        add_item('caviar');
	        add_item('demon_flesh');
	        add_item('frog_legs');
	        add_item('liquid_smoke');
	        add_item('mandrake');
	        add_item('quicksilver');
	    }
	    if (level === 2) {
	        add_item('ghost_pepper');
	        add_item('insect_parts');
	        add_item('lizard_eggs');
	        add_item('squid_ink');
	        add_item('tentacles');
	    }
	    if (level === 3) {
	        add_item('fairy_wings');
	        add_item('nightshade');
	        add_item('snake_venom');
	    }
	    if (level === 4) {
	        add_item('pufferfish');
	        add_item('slime');
	        add_item('toadstool');
	    }
	    if (level === 5) {
	        add_item('bone_marrow');
	        add_item('lemons');
	        add_item('leopard_spots');
	    }
	},

	getIngredientFromName: function(name){
	    return ing[name];
	},

	generateCandy: function(){
		/*

	    flavorList = [];
	    effects = [];
	    currentColor = [255, 255, 255];
	    numCol = 0;
	    totalIngred = 0;
	    dirty = false;
	    square.tint = PlayState.hexFromArray(currentColor);*/
	    FinalCandy.createSprite(effects,currentColor,sparkles);
	},

	checkWin: function(){
		/*

	    flavorList = [];
	    effects = [];
	    currentColor = [255, 255, 255];
	    numCol = 0;
	    totalIngred = 0;
	    dirty = false;
	    square.tint = PlayState.hexFromArray(currentColor);*/
	    var winChecker
	    console.log(PlayState.winState);
	    for (winChecker in PlayState.winState.flavors){
	    	if (!PlayState.winState.flavors.hasOwnProperty(winChecker)) {continue;}
	    	if (PlayState.countItems(flavorList,winChecker) !==PlayState.winState.flavors[winChecker]){
	    		console.log(winChecker);
	    		return false;
	    	}
	    }
	    winChecker=effects.slice();
	    for (var iC =0; iC<PlayState.winState.effects.length; iC++){
	    	var winEffectIndex=winChecker.indexOf(PlayState.winState.effects[iC]);
	        if (winEffectIndex !== -1){
	        	winChecker.splice(winEffectIndex, 1);
            } else {
            	return false;
            }
	    }
	    if (winChecker.length!==0){
	    	console.log(winChecker);
	    	return false;
	    }
	    winChecker=PlayState.colorStringFromArray(currentColor);
	    if (winChecker!==PlayState.winState.color){
	    	console.log(winChecker);
	    	return false;
	    }
	    return true;
	},

	closingScene: function(){
		Cutscene.sceneData=CutsceneContent[PlayState.levelNum].close;
		Cutscene.opening=false;
		game.state.start('Cut');
	},

	countItems: function(array,item){
		iCount=0;
		for (var iC =0; iC<array.length; iC++){
			if (array[iC] === item){
				iCount++;
			}
		}
		return iCount;
	}
}
