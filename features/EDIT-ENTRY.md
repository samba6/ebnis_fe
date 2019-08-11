## EDIT ENTRY

Given we are in edit entry modal
then we should see title as **Edit Entry**
then we should see experience title
then we should see button to dismiss the entry
then we should see an **edit** button near definition title

When user clicks on definition title **edit** button
then definition title should be placed inside a text box
and edit button should be changed to **dismiss** button
When definition title is changed
then we should not see the dismiss button
When definition title is changed back to original
then we should see the dismiss button again

```javascript
{
	notEditingTitle: {
  editingData: {
    				on: {
    					clickEditBtn: "editingTitle"
    				},
    			}
    		},

    		editingTitleInit: {
    			on: {
    				changeTitle: "editingTitle"
    			},
    			comments: [
    				"title placed in text box for editing"
    				"dismiss button",
    			]
    		},

    		editingTitle: {
    			"": {
    				on:
    			}
    		}
}
```

## COMMENTS

An entry can have multiple comments

## SPECIFY DECIMAL DATA AS INTEGER

Entering an integer data for decimal type should be valid. Currently, the backend sees integer data for decimal as invalid.
