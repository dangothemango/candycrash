
var PlayState = {

	preload: function(){
	    	//temp -- include ingredient json file when completed
		game.load.atlas('seacreatures', 'assets/images/seacreatures_json.png', 'assets/images/seacreatures_json.json');
		game.load.image('cauldron', 'assets/images/cauldron.png');
	},

	create: function() {

		console.log("Play State");

		//debug text
		text = game.add.text(100, 500, 'Nothing in the cauldron', { font: "15px Arial", fill: "#ff0044", align: "center" });

		crabCount = 0;

		//  This is just a visual debug grid, it's not needed for the actual Group.align to work
		game.add.sprite(0, 0, game.create.grid('grid', 100 * 15, 100 * 3, 100, 100, 'rgba(0, 250, 0, 1)'));

		cauldron = game.add.sprite(1050,475, 'cauldron');
		cauldron.anchor.set(0.5);
		cauldron.width = 600;
		cauldron.height = 600;

		//group of sprites/items
		group = game.add.group();
		group.inputEnableChildren = true;

		//load from atlas file; sprite name|frameName
		group.createMultiple(3, 'seacreatures', ['blueJellyfish0000', 'crab10000', 'flyingFish0000'], true);

		//if touched, allow drag
		group.onChildInputDown.add(_drag,this); 

		//align on shelves or something
		group.align(15, 3, 100, 100, Phaser.CENTER);
		totalIngred = group.total;

	},

	update: function() {


	},
	
	render: function() {
		game.debug.text('Available Ingredients: ' + group.total, 74, 600);
		game.debug.text('Drop in cauldron to remove item from the Group', 10, 24);
    
	},

	dropHandler: function(item, pointer) {
		//removes from group if lands in cauldron
		if (checkOverlap(item, cauldron)) {
		//  Remove the item from the Group.
		// keep track of what was put in the cauldron
			if (item.frameName == 'crab10000') {
				crabCount += 1;
				text.text = 'Dropped ' + item.frameName + ' into the cauldron' + '\n' +  ' ' + crabCount + ' ' + item.frameName;
			}
			else
			{
				text.text = 'Dropped ' +  item.frameName + ' into the cauldron';
			}
			group.remove(item);
			}
	    else
	    {
		//if dropped else where, return to shelf/reset
		group.align(15, 3, 100, 100, Phaser.CENTER);

	    }

}


}
