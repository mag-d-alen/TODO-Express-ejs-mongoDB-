const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://admin_Mag:Ya9uHRTLbpdaSw4@cluster0.qfwzd.mongodb.net/todoDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });


//setting database
const itemsSchema = new mongoose.Schema({
  name: String
  });
const Item = mongoose.model("Item", itemsSchema);

const first = new Item({
  name: "Add new item to the list"
});


const defaultItems = [first];


const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);


const day = date.getDate();


app.get("/list", (req, res) => {

  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (error) => {
        if (error) {
          console.log(error);
        }
        else {
          res.redirect('/list');
        }
      })
    }
    else {
      res.render("list", { listTitle: day, newListItems: foundItems, customName: null });
    };
  })
})


app.get("/about", (req, res) => {
  res.render("about");
});


app.post("/about", (req, res) => {
   const customName = req.body.customName;
   res.redirect("/list/" + customName);
})

app.get('/list/:this', (req, res) => {
  const customName = _.capitalize(req.params.this);
  List.findOne({ name: customName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          items: defaultItems,
          name: customName
         });
               list.save();
        res.redirect("/list/" + customName);
      }
      else {
        res.render("list", { listTitle: customName , newListItems: foundList.items })
      }
    }
    else {
      console.log(err);
    }
  })
});
app.post("/list", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName === day) {
    item.save()
    res.redirect('back');
  }
  else { 
    List.findOne({ name: listName }, (error, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/list/' + listName);
    })
  }
})


app.post('/delete', (req, res) => {

  const checkedItemId = req.body.check;
  const listTitle = req.body.hiddenListName;

  if (listTitle === day) {
    Item.findOneAndDelete({ _id: checkedItemId }, (err) => {
      if (err) {
        console.log(err)
      }
      else { console.log("item successfully deleted") }
    })
    res.redirect('back');
  }
  else {
    //combined mongoDB findone methor and mongoose $pull method
    List.findOneAndUpdate({ name: listTitle }, { $pull: { items: { _id: checkedItemId } } }, (err, updatedList) => {
      if (err) {
        console.log(err)
      }
      else {
        res.redirect('back');
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log(`Server started successfully`);
})
