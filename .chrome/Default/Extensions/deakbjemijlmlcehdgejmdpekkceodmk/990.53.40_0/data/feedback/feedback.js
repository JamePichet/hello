snapAddEvent(window, 'load', snapInit);
// Global settings
var pageNumber=0;
var lastPageNumber=1;
var pBars=12;
var hasSubmitted = false;
var showButtons=true;
var startPoint;
var endPoint;
var timerStarted = false;
var allowStore=true;
var g_subm = false;
var pageContents=new Object();
var showButtonOptions=new Object();
var totalList=new Object();
var pageMapping=null;
var textSubLookup=null;
var usedPatterns = null;
var g_noReplyText = "";
var g_NoReply = "(no reply)";
var g_And = " and ";
//snap 10 JavaScript functions shared by web:html and msf based formats including webHost
var objectsById=new Object();
var missingObjects=new Object();
var dependents=new Object();
var askedCache=new Object();
var cacheSelectOptions=new Object();
var snapVars = new Object();
//var g_noReplyText = "%%SNAP_NR_MESSAGE";
//var g_NoReply = "%%SNAP_USERSTRINGNoReply%%_END_";
//var g_And = " %%SNAP_USERSTRINGSnapAnd%%_END_ ";
function snapVariable(vName, qName, gridFirstVname, inputType, responseType, numCodes, pageNum, askedCalc, validate, mustAns, exclusive, codeLabels, dependents)
{	this.vName = vName ? vName : null;	//String
	this.qName = qName ? qName : null;	//String
	this.gridFirstVname = gridFirstVname ? gridFirstVname : null;	//String
	this.inputType = inputType ? inputType : null;	//String: "checkbox", "radio", "select", "text", "hidden" //"textarea" being stated as "text" for now
	this.responseType = responseType ? responseType : null; //String: "Single", "Multiple", "Quantity", "Date", "Time", "Literal", "None"
	if (this.gridFirstVname != null)
	{	//grid-first or grid-next, but not grid header.
		var gridName = gridFirstVname + "_GRID";
		var gHeader = snapVars[gridName];
		if (gHeader == null)
		{	gHeader = new snapVariable(gridName);
			gHeader.gridMembers = new Array();
			gHeader.gridFirstVname = gridFirstVname;
			gHeader.pageNum = pageNum;
		}
		gHeader.gridMembers[gHeader.gridMembers.length] = vName;
		if (askedCalc && !gHeader.askedCalc)
		{	gHeader.askedCalc = getGridRouting;
		}
	}
	this.codeLabels = codeLabels ? codeLabels : null;	//Array
	this.askedCalc = askedCalc ? askedCalc : null;	//Function
	this.validate = validate ? validate : null;	//Function
	this.mustAns = mustAns ? mustAns : false;	//bool
	this.exclusive = exclusive ? exclusive : null;	//Array
	this.numCodes = numCodes ? numCodes : 0;	//Number
	this.pageNum = pageNum ? pageNum : 0;	//Number
	this.dependents = dependents ? dependents : null;	//Array
	snapVars[vName] = this;
	if (!snapVariable.prototype.IsGrid)
	{	snapVariable.prototype.IsGrid = function(){return (null != this.gridFirstVname);}
	}
}
function snapVarMask(vName, codeMask, autoAnswer)
{	var sVar = snapVars[vName];
	if (sVar)
	{	sVar.codeMask = codeMask ? codeMask : null;
		sVar.autoAnswer = autoAnswer ? autoAnswer : null;
		if (sVar.gridFirstVname != null)
		{	var gridName = sVar.gridFirstVname + "_GRID";
			var gHeader = snapVars[gridName];
			if (gHeader && !gHeader.askedCalc)
			{	gHeader.askedCalc = getGridRouting;
			}
		}
	}
}
function getGridRouting()
{	var askedVal = false;
	for (var i in this.gridMembers)
	{	if (!askedVal)
		{	askedVal = asked(this.gridMembers[i]);
		}
	}
	return askedVal;
}
function FindQuestion(qName)
{	qName = qName.toLowerCase();
	var retVal = null;
	for (var vName in snapVars)
	{	var sVar = snapVars[vName];
		if (sVar && sVar.qName && sVar.qName.toLowerCase()==qName)
		{retVal = sVar;break;
		}
	}
	if (!retVal)
		retVal = snapVars[qName.toUpperCase()];
	return retVal;
}
function snapHookEvents(question)
{	var items = snapObjectsByName(question);
	var i;
	var item;
	for (i=0; i<items.length; i++)
	{	item=items[i];
		if (item.type)
		{	if (item.type=='checkbox' || item.type=='radio')
				snapAddEvent(item, 'click', snapChangeMade);
			else if (item.type=='select-one' || item.type=='select-multiple')
				snapAddEvent(item, 'change', snapChangeMade);
			else if (item.type=='text' || item.type=='textarea')
				snapAddEvent(item, 'blur', snapChangeMade);
		}
	}
}
function snapAddEvent(obj, evType, fn)
{	var result=false;
	if (obj)
	{	if (obj.attachEvent)
		{	result=obj.attachEvent("on"+evType, fn);
		} else if (obj.addEventListener)
		{	obj.addEventListener(evType, fn, true);
			result=true;
		}
	}
	return result;
}
function snapGlobalDoc()
{	return document.forms["SnapForm"].elements;
}
function snapObject(id)
{	var ret = objectsById[id];
	if (ret == null)
	{	if (missingObjects[id] == null)
		{	ret = document.getElementById(id);
			if (ret == null)
			{	missingObjects[id] = true;
			}
			objectsById[id] = ret;
		}
	}
	return ret;
}
function snapObjectsByName(name)
{	return document.getElementsByName(name);
}
function snapObjectsByTagName(tagName)
{	return document.getElementsByTagName(tagName);
}
function killEvent(eventOb)
{	if (eventOb)
	{	if (null != eventOb.cancelBubble) eventOb.cancelBubble = true;
		if (eventOb.stopPropagation) eventOb.stopPropagation();
		if (null != eventOb.returnValue) eventOb.returnValue = false;
		if (eventOb.preventDefault) eventOb.preventDefault();
	}
}
function snapEventOrigin(arg)
{	if (arg.srcElement)
		return arg.srcElement;
	else if (arg.target)
		return arg.target;
	return null;
}
function TextToHtml(txtValue)
{	var htmlValue = txtValue.replace(/&/g, "&amp;");
	htmlValue = htmlValue.replace(/[<]/g, "&lt;");
	htmlValue = htmlValue.replace(/>/g, "&gt;");
	htmlValue = htmlValue.replace(/\r\n/g,"<br>");
	htmlValue = htmlValue.replace(/\n/g, "<br>");
	htmlValue = htmlValue.replace(/\r/g,"<br>");
	htmlValue = htmlValue.replace(/\t/g, "&nbsp;");
	return htmlValue;
}
function snapFocusObject(object)
{	var done = false;
	if (object)
	{	try
		{	object.focus();
			done = true;
		}
		catch (e)//hidden control
		{	done = false;
		}
	}
	return done;
}
function snapShowQuestion(vName)
{	var control = snapObject(vName + "_1");
	snapFocusObject(control);
	var tab = snapObject(vName);
	if (tab)
	{	var offset = findObjY(tab);
		if (window.scrollTo)
		{	window.scrollTo(0,offset);
		}else if (window.scroll)
		{	window.scroll(0,offset);
		}
	}
}
function findObjY(obj)
{	var curtop = 0;
	if (obj.offsetParent)
	{	while (obj.offsetParent)
		{	curtop += obj.offsetTop;
			obj = obj.offsetParent;
		}
	}else if (obj.y)
		curtop = obj.y;
	return curtop;
}
//recursivley Invalidate Routing cache for dependents of 'question'
function snapUndoRoutingFor(vName)
{	if (vName && dependents[vName])
	{	var undo=dependents[vName];
		for (var i=0; i<undo.length; i++)
		{	var thisVar = undo[i];
			var sVar = snapVars[thisVar];
			if (sVar && sVar.IsGrid())
			{	var gridOwner = sVar.gridFirstVname;
				gridOwner += "_GRID";
				if (askedCache[gridOwner]!=null)
					delete askedCache[gridOwner];
			}
			if (askedCache[thisVar]!=null)
			{	delete askedCache[thisVar];
				snapUndoRoutingFor(thisVar);
			}else if (sVar && !sVar.askedCalc)
			{	snapUndoRoutingFor(thisVar);
			}
		}
	}
}
function resetRouting()
{	askedCache = new Object();
}
function snapEvalAllRouting()
{	var somethingShown=false;
	if (snapVars)
	{	for (var vName in snapVars)
		{	if(snapEvalAskedFor(vName))
			{	somethingShown=true;
			}
		}
	}
	return somethingShown;
}
////////////////////////////////////////////////////////////////////////////////
function snapInclude(obj, show, val)
{	var changed = false;
	if (obj)
	{	if (val == null)
		{	val = '';
		}
		if (!show)
		{	val = 'none';
		}
		if (obj.style.display!=val)
		{	obj.style.display = val;
			changed = true;
		}
	}
	return changed;
}
function snapHide(obj, show)
{	if (obj)
	{	obj.style.visibility=show?'visible':'hidden';
	}
}
function snapIsIncluded(obj)
{	var result=false;
	if (obj)
		result=(obj.style.display!='none');
	return result;
}
function findArrayValue(array, value)
{	var i;
	for(i=0;i<array.length;i++)
	{	if(array[i]==value)
			return i;
	}
	return null;
}
function snapSwapObs(aCode, newCode)
{	if(aCode && newCode)
	{	var aParent=aCode.parentNode;
		var newParent=newCode.parentNode;
		if (aParent &&newParent)
		{	aParent.removeChild(aCode);
			newParent.removeChild(newCode);
			aParent.appendChild(newCode);
			newParent.appendChild(aCode);
		}
	}
}
////////////////////////////////////////////////////////////////////////////////
// Variable No Reply
function doAutoAns(vName)
{	var sVar = snapVars[vName];
	if (sVar && sVar.codeMask)
	{	var numCodes = sVar.numCodes;
		var selObj = null;
		if (snapIsDropdown(vName))
			selObj = snapObject(vName+'_1');
		var changed = false;
		for(var i=1;i<=numCodes;i++)
		{	var showThisCode=sVar.codeMask(i);
			if (selObj && selObj.options)
			{	var found = false;
				for (var x = 0; x < selObj.options.length && !found; x++)
				{	if (selObj.options[x].value == i)
					{	found = true;
						if (selObj.options[x].selected != null)
						{	if (showThisCode != selObj.options[x].selected)
							{	changed = true;
								selObj.options[x].selected = showThisCode;
							}
						}
					}
				}
			}else
			{	var codeOb = snapObject(vName+'_'+i);
				if (codeOb && codeOb.checked != null)
				{	if (showThisCode != codeOb.checked)
					{	changed = true;
						codeOb.checked = showThisCode;
						if (sVar.checkImage != null)
							SyncImage(vName, i);
					}
				}
			}
		}
		if (changed)
			snapOnChange(vName);
	}
}
function snapCodeBox(vName, i)
{	var box = null;
	var sVar = snapVars[vName];
	if (sVar && (sVar.checkImage!=null))
	{	box = sVar.imgCodeBox[i];
	}
	if (box==null)
	{	box = snapObject(vName+'_'+i);
	}
	return box;
}
function snapGridLine(vName)
{
	var gridLine=null;
	var elem=snapObject(vName+'_1');
	while (elem && (!gridLine || gridLine.id == null || gridLine.id != vName))
	{
		while(elem!=null && (elem.tagName==null || elem.tagName.toLowerCase()!='tr'))
			elem=elem.parentNode;
		if (elem != null)
		{
			if (!gridLine || (elem.id != null && elem.id == vName))
				gridLine = elem;
			elem=elem.parentNode;
		}
	}
	return gridLine;
}
////////////////////////////////////////////////////////////////////////////////
// Variable Not Asked
function snapEvalAskedFor(vName, postponedItems)
{	var somethingShown=true;
	var sVar = snapVars[vName];
	var changed = false;
	if(sVar && (sVar.askedCalc || sVar.codeMask))
	{	var ask=asked(vName);
		somethingShown=ask;
		if(sVar.IsGrid())
		{
					var gridLine = snapGridLine(vName);
			if(gridLine!=null)
			{	snapInclude(gridLine, ask);
			}
			var gridOwner=sVar.gridFirstVname;
			if(gridOwner != vName)
			{	snapInclude(snapObject(vName+'_SPACER'), ask);
			}
			var gridName = gridOwner +"_GRID";
			if(snapVars[gridName] && snapVars[gridName].askedCalc)
			{	var gridask=asked(gridName);
				snapInclude(snapObject(gridName), gridask);
				snapInclude(snapObject(gridOwner+'_SPACER'), gridask);
				somethingShown=gridask;
			}
		} else
		{	if (snapInclude(snapObject(vName), ask))
				changed = true;
			snapInclude(snapObject(vName+'_SPACER'), ask);
		}
		if (!ask && sVar.doAutoAns)
		{	doAutoAns(vName);
		}
	}
	if(somethingShown && sVar && sVar.codeMask)
	{	var isCombo = snapIsDropdown(vName);
		var numCodes = sVar.numCodes;
		var i;
		var showThisCode;
		somethingShown=false;
		for(i=1;i<=numCodes;i++)
		{	showThisCode=sVar.codeMask(i);
			if (isCombo)
			{	if (snapIncludeCombo(vName, i, showThisCode, postponedItems))
					changed = true;
			}else
			{	var codeObject = snapObject(vName+'c'+i);
				var codeBox = snapCodeBox(vName, i);
				if(codeObject)
					snapInclude(codeObject, showThisCode);
				else
					snapInclude(codeBox, showThisCode);
				snapHide(snapObject(vName+'g'+i), showThisCode);
				snapHide(snapObject(vName+'v'+i), showThisCode);
				if (!showThisCode)
				{	var checkBox = snapObject(vName+'_'+i);
					if (checkBox && (checkBox.checked))
					{	checkBox.checked = false;
						if (checkBox != codeBox)
							SyncImage(vName, i);
						changed = true;
					}
				}
			}
			if(showThisCode)
				somethingShown=true;
		}
	}
	if (changed)
		snapOnChange(vName);
	return somethingShown;
}
function snapIncludeCombo(vName, code, showThisCode, postponedItems)
{	var changed = false;
	var selOb = snapObject(vName + '_1');
	if (selOb && selOb.options)
	{	var found = false;
		if (showThisCode)
		{	var removedList = cacheSelectOptions[vName];
			if (removedList)
			{	for (var i =0; i < removedList.length && !found; i++)
				{	if (removedList[i].value != null && removedList[i].value == code)
					{	found = true;
						if (postponedItems)
						{	postponedItems[vName] = true;
						}else
						{	var option = removedList[i];
							removedList.splice(i, 1);
							var pos = null;
							for (var j =0; j < selOb.options.length && (null == pos); j++)
							{	if (selOb.options[j].value > option.value || (selOb.options[j].value ==0 && selOb.options[j].text==""))
								{	pos = selOb.options[j];
								}
							}
							selOb.insertBefore(option, pos );
						}
					}
				}
			}
		}else
		{	for (var i =0; i < selOb.options.length && !found; i++)
			{	if (selOb.options[i].value == code)
				{	found = true;
					if (selOb.options[i].selected)
					{	changed = true;
						try
						{b.options[i].selected = false;
						}catch(e)
						{//ie 6 bug?
						}
					}
					if (postponedItems)
					{	postponedItems[vName] = true;
					}else
					{	var option = selOb.options[i];
						selOb.removeChild(option);
						if (!cacheSelectOptions[vName])
							cacheSelectOptions[vName] = new Array();
						var arr = cacheSelectOptions[vName];
						arr[arr.length] = option;
					}
				}
			}
		}
	}
	return changed;
}
////////////////////////////////////////////////////////////////////////////////
// Variable exclusive
function snapCheckExclusiveOf(sVar, object)
{	if ((sVar.checkImage != null) && object.type && (object.type == 'image'))
	{	object = resolveCheckImg(sVar, object);
	}
	if (object.checked)
	{	var changed = false;
		var c;
		var excl=sVar.exclusive;
		var code=parseInt(object.id.substr(object.id.indexOf('_')+1), 10);
		var isExclusive=false;
		for (c=0; c<excl.length && !isExclusive; c++)
		{	if (excl[c]==code)
				isExclusive=true;
		}
		if (isExclusive)
		{	var numCodes=sVar.numCodes;
			for (c=1; c<=numCodes; c++)
			{	var codeBox = snapObject(sVar.vName+'_'+c);
				if (codeBox && (object!=codeBox) && (codeBox.checked!=null))
				{	codeBox.checked=false;
					if (sVar.checkImage != null)
						SyncImage(sVar.vName, c);
					changed = true;
				}
			}
		} else
		{	for (c=0; c<excl.length; c++)
			{	code=snapObject(object.name+'_'+excl[c]);
				if (code && code.checked)
				{	code.checked=false;
					if (sVar.checkImage != null)
						SyncImage(sVar.vName, excl[c]);
					changed = true;
				}
			}
		}
		if (changed)
		{	snapOnChange(object.name);
		}
	}
}
////////////////////////////////////////////////////////////////////////////////
function snapNumCodes(vName)
{	var result=0;
	var sVar = snapVars[vName];
	if (sVar)
	{	result = sVar.numCodes;
	}
	return result;
}
function snapIsOpen(vName)
{	var result = false;
	var sVar = snapVars[vName];
	if (sVar)
	{	result = sVar.isOpen;
		if (result==null &&sVar.inputType)
		{	result = (sVar.inputType == "text" || sVar.inputType == "textarea" || sVar.inputType == "hidden");
			sVar.isOpen = result;
		}
	}
	return result;
}
function snapIsClosed(vName)
{	var result = false;
	var sVar = snapVars[vName];
	if (sVar)
	{	result = sVar.isClosed;
		if (result==null && sVar.responseType)
		{	result = (sVar.responseType == "M" || sVar.responseType == "S");
			sVar.isClosed = result;
		}
	}
	return result;
}
function snapIsDropdown(vName)
{	var result = false;
	var sVar = snapVars[vName];
	if (sVar)
	{	result = sVar.isDropDown;
		if (result==null && sVar.inputType)
		{	result = (sVar.inputType == "select");
			sVar.isDropDown = result;
		}
	}
	return result;
}
////////////////////////////////////////////////////////////////////////////////
// Variable response
function snapVarReply(vName)
{	var result=g_NoReply;
	//if (asked(vName))
	{	if(snapIsOpen(vName))
			result=snapOpenReply(vName);
		else if(snapIsClosed(vName))
			result=snapClosedReply(vName);
	}
	return result;
}
function snapVarValue(vName)
{	var result="";
	if (snapIsDropdown(vName))
	{	var code=snapObject(vName+'_1');
		if(code.options)
		{	for (var i = 0; i < code.options.length; i++)
			{	var thisOption=code.options[i];
				if(thisOption!=null && thisOption.selected && thisOption.value!=null && thisOption.value.length>0)
				{	if(result.length>0)
						result+=';';
					result+=thisOption.value;
				}
			}
		}
	} else 
	{	var c=snapNumCodes(vName);
		while(c > 0)
		{	code=snapObject(vName+'_'+c);
			if (code)
			{	if((code.checked==null || code.checked) && code.value!=null && code.value.length>0)
				{	if(result.length>0)
						result+=';';
					result+=code.value;
				}
			}
			c--;
		}
	}
	return result;
}
function snapClosedAns(vName)
{	var result=null;
	if(asked(vName))
	{	result=snapVarValue(vName);
	}
	if(result==null)
		result="";
	return result;
}
function snapClosedReply(vName)
{	var result=g_NoReply;
	var response=snapVarValue(vName);
	if(response.length>0)
	{	var responses=response.split(";");
		var i;
		result="";
		for(i=0;i<responses.length;i++)
		{	if(i>0)
			{	if(i<responses.length-1)
					result+=", ";
				else
					result+=g_And;
			}
			result += snapCodeLabel(vName, responses[i]);
		}
	}
	return result;
}
function snapCodeLabel(vName, code)
{	var result=code;
	var sVar = snapVars[vName];
	if (sVar && sVar.codeLabels)
	{	if (0 < code && code <= sVar.codeLabels.length)
		{	result = sVar.codeLabels[code - 1];
		}
	}
	return result;
}
function snapOpenValue(vName)
{
	var reply="";
	var glovar=snapObject(vName+'_1');
	if(glovar != null && glovar.value!=null)
		reply=""+glovar.value;
	if(reply==g_noReplyText)
		reply="";
	reply=reply.replace(/^\s*/,"").replace(/\s*$/,"");
	return reply;
}
function snapOpenAns(vName)
{	var reply=""
	if(asked(vName))
	{
		reply=snapOpenValue(vName);
	}
	return reply;
}
function snapOpenReply(vName)
{	var reply=snapOpenValue(vName);
	if(reply==null || reply.length==0 || reply==g_noReplyText)
		reply=g_NoReply;
	return reply;
}
function snapSetOpenReply(vName, value)
{	var glovar=snapObject(vName+'_1');
	if(glovar != null && glovar.value!=null)
		glovar.value=value;
}
function snapChangeMade(arg)
{	var origin = snapEventOrigin(arg);
	if (origin)
	{	snapCheckValueOf(origin);
		snapOnChange(origin.name);
	}
}
function snapOnChange(vName)
{	if (vName)
	{	var sVar = snapVars[vName];
		if (sVar && sVar.OnChangeFn)
			sVar.OnChangeFn();
		snapUndoRoutingFor(vName);
		if (typeof snapEvalTotals != 'undefined'){ snapEvalTotals(vName);}
		if (typeof snapSubstituteText != 'undefined'){ snapSubstituteText(vName);}
		if (typeof snapEvalPageRouting != 'undefined'){ snapEvalPageRouting();}
		else if (typeof snapEvalAllRouting != 'undefined'){ snapEvalAllRouting();}
	}
}
// Check syntax of open-ended variables / check exclusive code settings for others
function snapCheckValueOf(object)
{	if (object.name && object.id)
	{	var sVar = snapVars[object.name];
		if (sVar && sVar.exclusive)
		{	if (sVar.inputType == 'checkbox')
			{	snapCheckExclusiveOf(sVar, object);
			}else if (sVar.inputType == 'select')
			{	snapSelectExclusiveOf(sVar, object);
			}
		}
	}
}
function snapSelectExclusiveOf(sVar,object)
{	if (nota_dd)
	{	nota_dd(object, sVar.exclusive);
	}
}
var nota_prevList = new Array();
var nota_firstCode=0,nota_lastSingleClicked=0,nota_numSelected=0,nota_lastCode=0;
function nota_dd(selectOb, codes)
{	var newList=new Array();
	var currentList=new Array();
	var lastClickedCode=0,endCode=0,i=0,j=0;
	var isLastSingle=false,found=false,unSelected=false;
	newList = nota_getNewList(selectOb);
	currentList = nota_getCurrentList(selectOb);
	lastClickedCode = nota_getLastClickedCode(currentList,newList);
	if (nota_numSelected>1 && !isNaN(nota_firstCode) && nota_firstCode!=null && !isNaN(nota_lastCode) && nota_lastCode!=null)
	{	isLastSingle=nota_isInNumArray(codes, selectOb.options[nota_lastCode].value, 0);
		var i=nota_firstCode;
		endCode=(nota_firstCode<nota_lastCode) ? nota_lastCode+1 : lastCode-1;
		while(i!=endCode)	//loop all codes in range nota_firstCode -> nota_lastCode
		{	if ((isLastSingle && i!=lastClickedCode) || (nota_isInNumArray(codes, selectOb.options[i].value, 0) && selectOb.options[i].selected==true))
			{	selectOb.options[i].selected=false;
				unSelected=true;
			}
			nota_firstCode<nota_lastCode ? i++ : i--;
		}
	}
	if (unSelected==true)
		selectOb.selectedIndex=lastClickedCode;
	nota_prevList = nota_getCurrentList(selectOb);
	nota_lastSingleClicked = newList[0];
}
function nota_getCurrentList(selectOb)
{	//Return all codes currently checked
	var i=0,j=0,lastJ=0;
	var cList=new Array();
	nota_firstCode=-1;
	nota_lastCode=-1;
	for(i=0;i<selectOb.length;i++)
	{	if (selectOb[i].selected==true)
		{	if (nota_firstCode<0)nota_firstCode=i;
			if (j>lastJ)
			{	nota_lastCode=i;
				lastJ=j
			}
			cList[j]=i;
			j++;
		}
	}
	return cList;
}
function nota_getLastClickedCode(currList,newList)
{	//If user has clicked up the list return the first code from newList
	//nota_lastSingleClicked is needed for Ctrl_0(M), Ctrl_5(M), Shift_1 over a single
	if (newList.length==1 || newList[0]<nota_prevList[0] || newList[0]<nota_lastSingleClicked)
		return newList[0];
	else	//If user has clicked down the list return the last code from newList
		return newList[newList.length-1];
}
function nota_isInNumArray(arr, i, startIndex)
{	var j=0;
	var found=false;
	if (!(arr==null))
	{	for (j=startIndex; j<arr.length; j++)
		{	if (arr[j]==i) found=true;
		}
	}
	return found;
}
function nota_getNewList(selectOb)
{	//returns allChecked - previousList
	var i,j,k=0;
	nota_numSelected=0;
	var found=false;
	var newList = new Array();
	var collection = selectOb;
	for (i=0; i<collection.length; i++)
	{	if (collection[i].selected==true)
		{	nota_numSelected++;
			if (!nota_isInNumArray(nota_prevList, i, 0))
			{	newList[k]=i;
				k++;
			}
		}
	}
	return newList;
}
////////////////////////////////////////////////////////////////////////////////
function getAsked(vName)
{	var isAsked = true;
	if(!vName || vName=="")
	{	isAsked=false;
	} else
	{	var sVar = snapVars[vName];
		if (!sVar)
		{	isAsked=true;//?
		}else if(sVar.askedCalc)
		{	isAsked=sVar.askedCalc();
		}
		if (isAsked && sVar.codeMask)
		{	var numCodes=sVar.numCodes;
			var autoReplies=0;
			if (sVar.autoAnswer)
			{	sVar.doAutoAns = false;
				autoReplies = sVar.autoAnswer;
			}
			var showing = 0;
			for(var i=1;i<=numCodes && (showing <= autoReplies);i++)
			{	var showThisCode=sVar.codeMask(i);
				if (showThisCode)
					showing++;
			}
			if (showing <= autoReplies)
			{	isAsked = false;
				if (autoReplies > 0)
					sVar.doAutoAns = true;
			}
		}
	}
	return isAsked;
}
function asked(vName)
{	if (null == askedCache[vName])
	{	askedCache[vName]=getAsked(vName);
		if (null == askedCache[vName])
		{	askedCache[vName]= true;
		}
	}
	return askedCache[vName];
}
function noreply(vName)
{	var isNR = false;
	if (asked(vName))
	{	if (ans(vName) == "")
		{	isNR = true;
		}
	}
	return isNR;
}
function ans(vName)
{	var answer="";
	if(snapIsOpen(vName))
		answer=snapOpenAns(vName);
	else if(snapIsClosed(vName))
		answer=snapClosedAns(vName);
	return answer;
}
function ansAsNum(vName)
{	return parseFloat(ans(vName));
}
function cVR(vName,value)
{	var result=false;
	if (asked(vName))
	{	var glovar=snapObject(vName);
		if(glovar != null)
		{	var testValue=snapVarValue(vName);
			if((";"+testValue+";").indexOf(";"+value+";")>=0)
			{	result=true;
			}
		}
	}
	return result;
}
function cVV(name1,name2)
{	var result=false;
	if (asked(name1) && asked(name2) && !noreply(name1) && !noreply(name2))
	{	var r1=";"+ans(name1)+";";
		var r2=";"+ans(name2)+";";
		while(r2.length>2&&!result)
		{	var i=r2.substring(1).indexOf(";")+1;
			if(r1.indexOf(r2.substring(0,i+1))>=0)
				result=true;
			else
				r2=r2.substring(i);
		}
	}
	return result;
}
function cVM(vName)//(, ...)
{	var result=false;
	var numArgs = arguments.length;
	if ((1 < numArgs) && asked(vName))
	{	if (snapIsClosed(vName))
		{	if (snapIsDropdown(vName))
			{	var control = snapObject(vName + '_1');
				if (control && (control.options != null))
				{	if (control.type.toLowerCase()=='select-one')
					{	if (control.options[control.selectedIndex] != null)
						{	var val = control.options[control.selectedIndex].value;
							if (val > 0)
							{	for (var i = 1; (i < numArgs) && !result; i++)
								{	result = (val == arguments[i]);
								}
							}
						}
					}else
					{	for (var opt = 0; !result && (opt < control.options.length); opt++)
						{	if (control.options[opt].selected && (control.options[opt].value>0))
							{	var val = control.options[opt].value;
								for (var i = 1; (i < numArgs) && !result; i++)
								{	result = (val == arguments[i]);
								}
							}
						}
					}
				}
			}else
			{	for (var i = 1; (i < numArgs) && !result; i++)
				{	var requiredCode = snapObject(vName + '_' + arguments[i]);
					if ((null != requiredCode) && (null != requiredCode.checked))
					{	result = (requiredCode.checked == true);
					}
				}
			}
		}else
		{	var answer = ans(vName);
			if (answer!="")
			{	answer = ";"+answer+";";
				for (var i = 1; (i < numArgs) && !result; i++)
				{	if (0 <= answer.indexOf(";"+arguments[i]+";"))
					{	result = true;
					}
				}
			}
		}
	}
	return result;
}
function cInRange(value, minValue, maxValue)
{	var result=(value!=null && (maxValue!=NaN) && (minValue!=NaN) && (value>=minValue && value<=maxValue)||(value>=maxValue && value<=minValue));
	return result;
}
////////////////////////////////////////////////////////////////////////////////
function codeReply(vName,nameCodes)
{	var reply="";
	var glovar=snapObject(vName);
	if(glovar != null)
	{	var first=true;
		var mValue=glovar.value+";";
		while(mValue.length>1)
		{	var cPos=mValue.indexOf(";");
			if(!first)
			{	if(cPos==mValue.length-1)
					reply+=g_And;
				else
					reply+=", ";
			}
			reply+=nameCodes[parseInt(mValue.substring(0,cPos), 10)-1];
			first=false;
			mValue=mValue.substring(cPos+1);
		}
	}
	if(reply.length==0)
		reply=g_NoReply;
	return reply;
}
//masking
function VarToNum(vName)
{	var result = 0;
	if (snapIsOpen(vName))
	{	var control = snapObject(vName + '_1');
		if (control)
		{	result = parseInt(snapOpenValue(vName), 10);
		}
	}else if (snapIsDropdown(vName))
	{	var control = snapObject(vName + '_1');
		if (control && (control.options != null))
		{	var ok = true;
			for (var x = 0; (x < control.options.length) && ok; x++)
			{	if (control.options[x].selected)
				{	if (0 == result)
					{	result = control.options[x].value;
					}else
					{	result = 0;
						ok = false;
					}
				}
			}
		}
	}else if (snapIsClosed(vName))
	{	var numCodes = snapNumCodes(vName);
		var ok = true;
		for (var x = 1; (x <= numCodes) && ok; x++)
		{	var control = snapObject(vName + '_' + x);
			if (control && control.checked)
			{	if (0 == result)
				{	result = control.value;
				}else
				{	result = 0;
					ok = false;
				}
			}
		}
	}
	if (0 == result)
	{	result = NaN;
	}
	return result;
}
////////////////////////////////////////////////////////////////////////////////
// Date and Time
function FormatDate(Date)
{	var dateString = "";
	if (snapIsUk())
	{	dateString += Date.getDate()+"/";
		dateString += (1 + Date.getMonth());
	} else
	{	dateString += (1 + Date.getMonth())+"/";
		dateString += Date.getDate();
	}
	dateString += "/" + Date.getYear();
	return dateString;
}
function FormatTime(Time)
{	var timeString = "";
	var tempStr = Time.getHours().toString();
	if (tempStr.length == 1)
		tempStr = "0" + tempStr;
	timeString += tempStr + ":";
	tempStr = Time.getMinutes().toString();
	if (tempStr.length == 1)
		tempStr = "0" + tempStr;
	timeString += tempStr + ":";
	tempStr = Time.getSeconds().toString();
	if (tempStr.length == 1)
		tempStr = "0" + tempStr;
	timeString += tempStr;
	return timeString;
}
function GetToday()
{	var Now = new Date();
	var Today = new Date(Now.getFullYear(), Now.getMonth(), Now.getDate(), 0, 0, 0, 0);
	return Today;
}
function getMonthName(i)
{	var month = "";
	switch (i)
	{
	case 0: month="January";break;
	case 1: month="February";break;
	case 2: month="March";break;
	case 3: month="April";break;
	case 4: month="May";break;
	case 5: month="June";break;
	case 6: month="July";break;
	case 7: month="August";break;
	case 8: month="September";break;
	case 9: month="October";break;
	case 10: month="November";break;
	case 11: month="December";break;
	}
	return month;
}
function GetNow()
{	var Now = new Date();
	Now.setFullYear(1970, 0, 1);
	return Now;
}
////////////////////////////////////////////////////////////////////////////////
function getLabel(labelArray, orderArray, code)
{	return labelArray[orderArray[code]];
}
function getValue(orderArray, code)
{	var val = orderArray[code] + 1;
	var str = "" + val;
	return str;
}
function V265asked(){return (ans("V263")==1);}
function V269asked(){return (cVR("V264",1));}
function V288asked(){return (cVR("V264",1));}
function V270asked(){return (cVR("V264",2));}
function V289asked(){return (cVR("V264",2));}
function V143asked(){return (cVR("V264",3));}
function V290asked(){return (cVR("V264",3));}
function V271asked(){return (cVR("V264",4));}
function V287asked(){return (cVR("V264",4));}





function onLabel(ctlId)
{
	var retVal = true;
	if (ctlId && document.getElementById)
	{	var ctl = document.getElementById(ctlId);
		if (ctl && ctl.type)
		{	retVal = false;
			var type = ctl.type.toLowerCase();
			if ((type == "radio") || (type == "checkbox"))
				ctl.click();
			if (type != "hidden")
				ctl.focus();
		}
	}
	return retVal;
}
function snapVarRotation(vName, type, method, count)
{	var sVar = snapVars[vName];
	if (sVar)
	{	sVar.rotType = type; //code or grid
		sVar.rotMethod = method;
		sVar.rotCount = count;
	}
}
////////////////////////////////////////////////////////////////////////////////
/***SNAP INIT START***/
function snapInit()
{	var query=unescape(location.search.substring(1));
	for (var p=1; p<=lastPageNumber; p++)
	{	snapInclude(snapObject('p_p'+p), false);
	}
	linkButton('b_next', snapNextPage);
	linkButton('b_back', snapBackPage);
	linkButton('b_submit', snapSubmitPage);
	linkButton('b_reset', snapResetPage);
	linkButton('b_restart', snapResetAll);
	linkButton('b_print', snapPrint);
	showButtonOptions['b_back']='pageNumber>=2&&pageNumber<=lastPageNumber';
	showButtonOptions['b_reset']='pageNumber>=1&&pageNumber<=lastPageNumber';
	showButtonOptions['b_next']='pageNumber>=1&&pageNumber<=lastPageNumber-1';
	showButtonOptions['b_submit']='pageNumber>=lastPageNumber&&pageNumber<=lastPageNumber';


	// List of variables that have one or more dependents
	dependents['V263']=new Array("V265");
	dependents['V264']=new Array("V269","V270","V271","V143","V287","V288","V289","V290");


	// identify which questions are on each page
	pageContents[1]=new Array("V2","V140","V141","V142","V262","V263","V265","V264","V269","V288","V270","V289","V143","V290","V271","V287","V276","V286","V277","V278","V281","V283","V284","V280","V199","V200");


	new snapVariable("V2", "N1", null, "none", "N", 0, 1, null, null, false, null, null, null);
	new snapVariable("V140", "Q0.a", "V140", "text", "L", 1, 1, null, null, true, null, null, null);
	new snapVariable("V141", "Q0.b", "V140", "text", "L", 1, 1, null, null, true, null, null, null);
	new snapVariable("V142", "Q0.c", "V140", "text", "L", 1, 1, null, null, true, null, null, null);
	new snapVariable("V262", "Q1", null, "radio", "S", 2, 1, null, null, false, null, null, null);
	new snapVariable("V263", "Q2", null, "radio", "S", 2, 1, null, null, false, null, null, dependents['V263']);
	new snapVariable("V265", "Q2.a", null, "text", "L", 1, 1, V265asked, null, false, null, null, null);
	new snapVariable("V264", "Q3", null, "checkbox", "M", 4, 1, null, null, false, null, null, dependents['V264']);
	new snapVariable("V269", "Q4.a", null, "radio", "S", 6, 1, V269asked, null, false, null, null, null);
	new snapVariable("V288", "Q6", null, "text", "L", 1, 1, V288asked, null, false, null, null, null);
	new snapVariable("V270", "Q5.a", null, "radio", "S", 6, 1, V270asked, null, false, null, null, null);
	new snapVariable("V289", "Q7", null, "text", "L", 1, 1, V289asked, null, false, null, null, null);
	new snapVariable("V143", "Q6.a", null, "radio", "S", 6, 1, V143asked, null, true, null, null, null);
	new snapVariable("V290", "Q8", null, "text", "L", 1, 1, V290asked, null, false, null, null, null);
	new snapVariable("V271", "Q7.a", null, "radio", "S", 6, 1, V271asked, null, false, null, null, null);
	new snapVariable("V287", "Q15", null, "text", "L", 1, 1, V287asked, null, false, null, null, null);
	new snapVariable("V276", "Q8.a", null, "radio", "S", 6, 1, null, null, false, null, null, null);
	new snapVariable("V286", "Q16", null, "text", "L", 1, 1, null, null, false, null, null, null);
	new snapVariable("V277", "Q9", null, "text", "L", 1, 1, null, null, false, null, null, null);
	new snapVariable("V278", "Q10", null, "radio", "S", 4, 1, null, null, false, null, null, null);
	new snapVariable("V281", "Q11", null, "text", "L", 1, 1, null, null, false, null, null, null);
	new snapVariable("V283", "Q12", null, "radio", "S", 2, 1, null, null, false, null, null, null);
	new snapVariable("V284", "Q12.a", null, "text", "L", 1, 1, null, null, false, null, null, null);
	new snapVariable("V280", "Q13", null, "text", "L", 1, 1, null, null, false, null, null, null);
	new snapVariable("V199", "Q14", null, "text", "L", 1, 1, null, null, true, null, null, null);
	new snapVariable("V200", "N2", null, "none", "N", 0, 1, null, null, false, null, null, null);


	//process query string, now variables exist
	snapQueryString(query);
	// check question responses when they change
	for(var i=1; i<=lastPageNumber; i++)
	{	if (pageContents[i])
		{	var pageItems = pageContents[i];
			for(var j=0; j<pageItems.length; j++)
			{	snapHookEvents(pageItems[j]);
			}
		}
	}
	// Prepare the first page
	var pleaseWait = snapObject("snapIntro");
	if (pleaseWait != null)
	{	var aParent=pleaseWait.parentNode;
		if (aParent != null)
		{	aParent.removeChild(pleaseWait);
			objectsById["snapIntro"] = null;
		}
	}
	snapApplyInitialSubstitutions();
	snapInclude(snapObject('snapbuttons'), true, 'block');
	snapInclude(snapObject('snapDiv'), true, 'block');
	if (lastPageNumber > 1)
		snapInclude(snapObject('b_progress'), true);

	snapNextPage();
}
/***SNAP INIT END***/
function linkButton(name, func)
{	var button = snapObject(name);
	var done = false;
	if (button && button.parentNode)
	{	var bParent = button.parentNode;
		if (bParent && bParent.tagName && ("a" == bParent.tagName.toLowerCase()))
		{	done = true;
			snapAddEvent(bParent, 'keypress',func);
			snapAddEvent(bParent, 'click',func);
		}
	}
	if (!done)
	{	snapAddEvent(button, 'click',func);
	}
}
function snapQueryString(query)
{	var pairs=query.split("&");
	for(var i=0; i<pairs.length;i++)
	{	var pos=pairs[i].indexOf('=');
		if (pos>0)
		{	var argName=pairs[i].substring(0,pos);
			var value=pairs[i].substring(pos+1);
			if ((argName=="id") || (argName=="u"))
			{snapSetOpenReply("0",value);
			}else if (argName=="p")
			{snapSetOpenReply("0",value);
			}else if (argName=="s")
			{snapSetOpenReply("0",value);
			}
			else //argName	is	question	Name,	not Vnumber
			{	var sVar	= FindQuestion(argName);
				if (sVar)
				{
					if	(snapIsClosed(sVar.vName) && !snapIsDropdown(sVar.vName))
					{	var codes=unescape(value).split(",");
						for(var c=0; c<codes.length;c++)
						{	setVarValue(sVar.vName+"_" + codes[c], "1");
						}
						SyncAllImages(sVar);
					}
					else
					{	setVarValue(sVar.vName+"_1", value);
					}
				}
			}
		}
	}
}
function snapMappedPage(page)
{	if (pageMapping != null)
	{	if(page>=1 && page<=lastPageNumber)
		{	page=pageMapping[page];
		}
	}
	return page;
}
// System
function SyncImage(vName, i)
{	
}
function SyncAllImages(sVar)
{	if (sVar && (sVar.checkImage != null))
	{	for (var i= 1;i<=sVar.numCodes;i++)
			SyncImage(sVar.vName, i);
	}
}
////////////////////////////////////////////////////////////////////////////////
function snapSubmitPage(eventOb)
{	if (snapIgnoreKey(eventOb))
		return false;
	killEvent(eventOb);
	var okToSubmit=false;
	var btn = snapObject('b_submit');
	if (!hasSubmitted && snapIsIncluded(btn) && !btn.disabled)
	{	btn.disabled=true;
		var somethingToShow=false;
		var nextPage=pageNumber;
		while(nextPage<=lastPageNumber && snapPageValidationOk(nextPage))
		{	nextPage++;
			if(nextPage<=lastPageNumber)
			{	somethingToShow=snapEvalShowPage(nextPage, false);
			}
		}
		if(nextPage > lastPageNumber)
		{	okToSubmit = true;
			hasSubmitted = true;
			snapShowPage(lastPageNumber);
		}
		if(nextPage<=lastPageNumber)
		{	btn.disabled=false;
			snapShowPage(nextPage);
			okToSubmit=false;
		}
	}
	if (okToSubmit)
	{	fEndTimer();
		//document.forms["SnapForm"].submit();
		sendFormByMail();
	}
	return false;
}
function snapIgnoreKey(eventOb)
{	var ignore= false;
	if (eventOb && (eventOb.type.toLowerCase()=="keypress") && (eventOb.keyCode != null))
	{	if ((eventOb.keyCode!=32) && (eventOb.keyCode!=10))
		{	ignore = true;
			if (eventOb.charCode!=null)
			{	if ((eventOb.charCode==32) || (eventOb.charCode==10))
					ignore = false;
			}
		}
	}
	return ignore;
}
function snapEvalShowPage(Pagenum, force)
{	var postponedItems = new Array(); //lengthy fix for bug in opera9
	var somethingToShow=snapEvalPageRouting(Pagenum, postponedItems);
	if(somethingToShow || force)
	{	snapShowPage(Pagenum);
		for (var vName in postponedItems)
		{	snapEvalAskedFor(vName);
		}
	}
	postponedItems = null;

	return somethingToShow;
}
function snapNextPage(eventOb)
{	if (snapIgnoreKey(eventOb)) return true;
	if (eventOb && eventOb.preventDefault) eventOb.preventDefault();

	var somethingToShow=false;
	var nextPage=pageNumber;
	while(nextPage<lastPageNumber && !somethingToShow && snapPageValidationOk(nextPage))
	{	nextPage++;
		somethingToShow=snapEvalShowPage(nextPage, nextPage==lastPageNumber);
	}
	return false;
}
function snapBackPage(eventOb)
{	if (snapIgnoreKey(eventOb)) return true;
	if (eventOb && eventOb.preventDefault) eventOb.preventDefault();

	var somethingToShow=false;
	var nextPage=pageNumber;
	while(nextPage>1 && !somethingToShow)
	{	nextPage--;
		somethingToShow=snapEvalShowPage(nextPage, (nextPage==1));
	}
	return false;
}
function snapPrint(eventOb)
{	if (snapIgnoreKey(eventOb)) return true;
		window.print();
}
function snapResetPage(eventOb)
{	if (snapIgnoreKey(eventOb)) return true;
	if (eventOb && eventOb.preventDefault) eventOb.preventDefault();

	var aPage=snapMappedPage(pageNumber);
	if (pageContents[aPage])
	{	var changed = false;
		var pageItems = pageContents[aPage];
		for(var i=0; i<pageItems.length; i++)
		{	var controls = snapObjectsByName(pageItems[i]);
			if (controls && controls.length > 0)
			{	for(var j=0; j<controls.length; j++)
				{	var elem = controls[j];
					if (elem && elem.tagName != null)
					{	var lTagName = elem.tagName.toLowerCase();
						if (lTagName=="input")
						{	if ((elem.type!= null) && (elem.type.toLowerCase() == 'text'))
							{	if (elem.value && elem.value!="")
								{	elem.value = "";
									changed = true;
								}
							}else if (elem.checked)
							{	elem.checked = false;
								changed = true;
							}
						}else if (lTagName=="textarea")
						{	if (elem.value && elem.value!="")
							{	elem.value = "";
								changed = true;
							}
						}else if (lTagName=="select")
						{	if (elem.selectedIndex != null)
							{	elem.selectedIndex = 0;
							}
							for (var op = 0; op < elem.options.length; op++)
							{	if (elem.options[op].value > 0 && elem.options[op].selected)
								{	elem.options[op].selected = false;
									changed = true;
								}
							}
						}
					}
				}
			}
		}
		if (changed)
		{	snapApplyInitialSubstitutions();
						resetRouting();
			snapEvalPageRouting();
		}
	}
	return false;
}
function snapResetAll(eventOb)
{	if (snapIgnoreKey(eventOb)) return true;
	document.forms["SnapForm"].reset();
	snapApplyInitialSubstitutions();
		resetRouting();
	snapEvalPageRouting();
	snapShowPage(1);
}
function snapShowPage(target)
{	if (target>=1 && target<=lastPageNumber)
	{	snapInclude(snapObject("p_p"+snapMappedPage(pageNumber)), false);
		snapInclude(snapObject("p_p"+snapMappedPage(target)), true, 'block');
		pageNumber=target;
		snapFocusPage(pageNumber);
	}
	if(lastPageNumber>0)
	{	// buttons
		for (var butn in showButtonOptions)
		{	snapIncludeBtn(snapObject(butn), eval(showButtonOptions[butn]));
		}
		// progress bar
		progress=snapObject("b_progress");
		if (progress)
		{	var progText = "";
			if (progress.tagName != null && progress.tagName.toLowerCase()=="span")
			{	progress.firstChild.nodeValue = progText;
			}else
			{	if(progress.src)
				{	var file=pbRatio(pBars);
					progress.src=progress.src.replace(/\d{2}\.gif/, file+".gif");
				}
				progress.alt=progText;
			}
		}
	}
}
function snapFocusObject(object)
{	var done = false;
	if (object)
	{	try
		{	object.focus();
			done = true;
		}
		catch (e)//hidden control
		{	done = false;
		}
	}
	return done;
}
function snapFocusPage(page)
{	var found = false;
	page=snapMappedPage(page);
	if(page>=1 && page<=lastPageNumber)
	{	if (pageContents[page])
		{	var pageItems = pageContents[page];
			for(var j=0; j<pageItems.length && !found; j++)
			{	if (getAsked(pageItems[j]))
				{	var code =0;
					var codeOb= null;
					do
					{	code++;
						codeOb = snapObject(pageItems[j]+'_'+code);
						found = snapFocusObject(codeOb);
					}
					while (!found && codeOb != null)
				}
			}
		}
		if (window.scrollTo)
		{	window.scrollTo(0,0);
		}else if (window.scroll)
		{	window.scroll(0,0);
		}
	}
}
function snapEvalPageRouting(aPage, postponedItems)
{	var somethingShown=false;
	if (aPage==null)
		aPage=pageNumber;
	aPage=snapMappedPage(aPage);
	if (aPage>=1 && aPage<=lastPageNumber && pageContents[aPage])
	{	var pageItems=pageContents[aPage];
		for (var i=0; i<pageItems.length; i++)
		{	if(snapEvalAskedFor(pageItems[i], postponedItems))
			{	somethingShown=true;
			}
		}
	}

	return somethingShown;
}
////////////////////////////////////////////////////////////////////////////////
function snapApplyInitialSubstitutions()
{	snapIntSubst();
	for (var vName in textSubLookup)
	{	var SpanArray = textSubLookup[vName];
		for(var i=0;i<SpanArray.length;i++)
		{	SpanArray[i].firstChild.nodeValue = snapVarReply(vName);
		}
	}
}
function snapIntSubst()
{	if (textSubLookup == null)
	{	textSubLookup = new Object();
		var all_span = snapObjectsByTagName('span');
		var i;
		for(i=0;i<all_span.length;i++)
		{	if(all_span[i].id)
			{	var nameLen = all_span[i].id.indexOf('_reply');
				if (nameLen > 0)
				{	var newName = all_span[i].id.substr(0, nameLen);
					if (textSubLookup[newName] == null)
					{	textSubLookup[newName] = new Array();
					}
					var subList = textSubLookup[newName];
					subList[subList.length] = all_span[i];
				}
			}
		}
	}
}
function snapSubstituteText(questionName)
{	snapIntSubst();
	if (textSubLookup[questionName] != null)
	{	var subList = textSubLookup[questionName];
		var i;
		for(i=0;i<subList.length;i++)
		{	if(subList[i].id && (0 == subList[i].id.indexOf(questionName+'_reply')))
			{	subList[i].firstChild.nodeValue=snapVarReply(questionName);
			}
		}
	}
}
////////////////////////////////////////////////////////////////////////////////
function snapEvalTotals(vName)
{	var expr=totalList[vName];
	if(expr!=null)
		eval(expr);
}
function totalise()
{	var i=0,j=0,sum=0,varFloat=0,notBlank=false,isZero=false,varString='',srcVar,tarVar;
	var lastValues = new Array();
	var allowNegs=arguments[arguments.length-3];
	var roundNums=arguments[arguments.length-2];
	var cleanNum=arguments[arguments.length-1];
	for (i=0; i<arguments.length-4; i++)
	{	srcVar=snapGlobalDoc()[arguments[i]];
		if (srcVar)
		{	varString = srcVar.value;
			if (cleanNum) varString = cleanNumber(srcVar.value, allowNegs);
			if (roundNums) varString = '' + Math.round(parseFloat(varString));
			varFloat = parseFloat(varString);
			if ((!allowNegs && varFloat < 0) || isNaN(varFloat))
			{	varString='';
				varFloat=0;
			}
			sum += varFloat;
			if (varString == '0') isZero=true;
			if (varString != '') notBlank=true;
			if (lastValues[i] != srcVar.value) srcVar.value = varString;
			lastValues[i] = varString;
		}
	}
	tarVar=snapGlobalDoc()[arguments[arguments.length-4]];
	if (tarVar && ((lastValues[i+1] != sum || lastValues[i+1] != tarVar.value) || sum==0))
	{	if (notBlank)
		{	if (sum > 0 || allowNegs)
				varString = sum;
			else
				isZero ? varString = '0' : varString = '';
			if (roundNums) varString = Math.round(sum);
			tarVar.value = varString;
		}else
		{	tarVar.value = '';
		}
		lastValues[i+1] = tarVar.value;
		if (typeof snapOnChange != 'undefined')
		{
			snapOnChange(arguments[arguments.length-4]);
		}
	}
}
function cleanNumber(varString, allowNegs)
{	var newVarString = "";
	if(allowNegs)
		newVarString=varString.replace(/^[^+\-0-9\.]*([+\-]?\d*\.?\d*).*$/, '$1');
	else
		newVarString=varString.replace(/^[^+0-9\.]*(\+?\d*\.?\d*).*$/, '$1');
	return newVarString;
}
function addSurveyPlus(eTypeStr, eHandler)
{//eventTypeStr, eventHandler, vName1, vName2...vNameN
	if (arguments != null && arguments.length > 2)
	{	var eTypeStr = arguments[0];	//eg "blur", "click".
		var eHandler = arguments[1];	//splus JS function call.
		for (var i=2; i <= arguments.length - 1; i++)
		{	var snapVar = snapGlobalDoc()[arguments[i]];
			if (snapVar)
			{	if (snapVar.length && !(snapVar.type && snapVar.type.indexOf("select") >= 0))
				{//Assign handler to all items in collection. eg. radio buttons in list.
					for (var j=0; j < snapVar.length; j++)
					{	snapAddEvent(snapVar[j], eTypeStr, eHandler);
					}
				}else
				{//Assign handler to single item in list. eg. text box, or single radio button.
					snapAddEvent(snapVar, eTypeStr, eHandler);
				}
			}
		}
	}
}
////////////////////////////////////////////////////////////////////////////////
function snapIncludeBtn(obj, show, val)
{	snapInclude(obj, show, val);
	if (obj && obj.parentNode)
	{	var bParent = obj.parentNode;
		if (bParent && bParent.tagName && ("a" == bParent.tagName.toLowerCase()))
		{	snapInclude(bParent, show, val);
		}
	}
}
////////////////////////////////////////////////////////////////////////////////
// Variable No Reply
function formatMessage(template, qName, num1, num2, pattern)
{
	if (qName)
	{	template = template.replace("<<question>>", qName);
	}
	if (num1 != null)
	{	template = template.replace("<<min>>", num1);
		template = template.replace("<<num>>", num1);
	}
	if (num2 != null)
	{	template = template.replace("<<max>>", num2);
		template = template.replace("<<num>>", num2);
	}
	if (qName)
	{	template = template.replace("<<pattern>>", pattern);
	}
	return template;
}
// Variable No Reply
function snapForceReply(vName, realName)
{	var result=true;
	if(noreply(vName))
	{	alert(formatMessage("Please provide an answer for question <<question>>.", realName));
		result=false;
		snapShowQuestion(vName);
	}
	return result;
}
function updateHighlight(sVar, result)
{
	if (!sVar.errOb)
	{
		var obj = snapObject(sVar.vName+'_1');
		var found = false;
		while (obj && !found)
		{
			if (!obj.className)
				obj=obj.parentNode;
			else if (obj.className.indexOf("_class") >= 0)
			{
				found = true;
				sVar.errOb = obj;
				sVar.validStyle = obj.className;
				if (obj.className.indexOf("_classT") >= 0)
					sVar.errStyle = "Err_classT";
				else
					sVar.errStyle = "Err_classR";
			}
			else
			{
				obj = obj.parentNode;
			}
		}
		if (!found)
			sVar.errOb = true;
	}
	if (sVar.errOb && (sVar.errOb != true) && sVar.errOb.className)
	{
		if (result)
			sVar.errOb.className = sVar.validStyle;
		else
			sVar.errOb.className = sVar.errStyle;
	}
}
function snapPageValidationOk(page)
{	var result=true;
	page=snapMappedPage(page);
	if(page>=1 && page<=lastPageNumber && pageContents[page])
	{	var pageItems = pageContents[page];
		for(var j=0; j<pageItems.length && result; j++)
		{	var vName = pageItems[j];
			var sVar = snapVars[vName];
			if (sVar)
			{	if(sVar.validate)
				{	if (asked(vName))
					{result=sVar.validate();
					}
				}
				if(result && sVar.mustAns)
				{	result=snapForceReply(vName, sVar.qName);
				}
				updateHighlight(sVar, result);
			}
		}
	}
	return result;
}
////////////////////////////////////////////////////////////////////////////////
function fStartTimer(uk)
{	if (!timerStarted)
	{	startPoint = new Date();
		var hours = startPoint.getHours();
		var mins = "00" + startPoint.getMinutes();
		var timeValue = ""+hours+":"+mins.substr(mins.length - 2);
		var days = startPoint.getDate();
		var months = startPoint.getMonth() + 1;
		var years = "00" + startPoint.getYear().toString();
		years = years.substr(years.length - 2);
		var dateValue;
		if (uk)
			dateValue = days + "/" + months + "/" + years;
		else
			dateValue = months + "/" + days + "/" + years;
		snapSetOpenReply("0", timeValue);
		snapSetOpenReply("0", dateValue);
		timerStarted = true;
	}
}
function fEndTimer()
{	endPoint = new Date();
	var hours = endPoint.getHours();
	var mins = "00" + endPoint.getMinutes();
	var timeValue = ""+hours+":"+mins.substr(mins.length - 2);
	snapSetOpenReply("0", timeValue);
	if (timerStarted)
	{	var durationValue=((endPoint - startPoint) / 60000);
		snapSetOpenReply("0", durationValue);
	}
	if (snapObject("0_1"))
	{	var days = endPoint.getDate();
		var months = endPoint.getMonth() + 1;
		var years = "00" + endPoint.getYear().toString();
		years = years.substr(years.length - 2);
		var dateValue;
		if (0)//true=uk,false=usa
			dateValue = days + "/" + months + "/" + years;
		else
			dateValue = months + "/" + days + "/" + years;
		snapSetOpenReply("0", dateValue);
	}
	timerStarted = false;
}
////////////////////////////////////////////////////////////////////////////////
function pbRatio(OutOf)
{	var result=1;
	if (pageNumber >= lastPageNumber)
		result = OutOf;
	else if (pageNumber <= 1)
		result =1;
	else if (OutOf <= 2)
		result = Math.round(OutOf*pageNumber/lastPageNumber);
	else
		result = 2 + Math.floor((OutOf-2)*(pageNumber-1)/(lastPageNumber-1));
	if (1>result)
		result="01";
	else if (10 > result)
		result = "0" + result;
	else
		result = "" + result;
	return result;
}
////////////////////////////////////////////////////////////////////////////////
// Validation
function isValidNum(vName,allowNegatives,realName)
{	var isValid=true;
	var locVar=snapObject(vName+ "_1");
	if (locVar != null)
	{	var numstr=snapOpenValue(vName);
		if (allowNegatives+""=="undefined" || allowNegatives+""=="null")
			allowNegatives = true;
		numstr+="";
		for(var i=0;i<numstr.length;i++)
		{	if (!((numstr.charAt(i)>="0")&&(numstr.charAt(i)<="9")||((numstr.charAt(i)==".")&&(numstr.charAt(i+1)!="."))||(numstr.charAt(i)=="-")))
				isValid=false;
			else if((numstr.charAt(i)=="-"&&i!=0)||(numstr.charAt(i)=="-"&&!allowNegatives))
				isValid=false;
		}
		if(!isValid)
		{	snapFocusObject(locVar);
			alert(formatMessage("Please enter a valid number for question <<question>>.", realName));
		}
	}
	return isValid;
}
// Validation
function RangeCheck(vName,realName,min,max,UiCode)
{	var isValid=true;
	var locVar=snapObject(vName+ "_1");
	if (locVar != null)
	{	var numstr=snapOpenValue(vName);
		if (0 < numstr.length)
		{	var number = parseFloat(numstr);
			if(number<min || number>max || isNaN(number))
			{	isValid = false;
				snapFocusObject(locVar);
				if ((1 == UiCode) && (min!=max))
				{	alert(formatMessage("Please give an answer between <<min>> and <<max>> for question <<question>>.", realName, ""+min, ""+max));
				} else if (0 != UiCode)
				{	alert(formatMessage("Please enter a valid number for question <<question>>.", realName));
				}
			}
		}
	}
	return isValid;
}
// Validation
function LiteralRange(vName,realName,min,max,UiCode)
{	var isValid=true;
	var locVar=snapObject(vName+ "_1");
	if (locVar != null)
	{	var numstr=snapOpenValue(vName);
		if (0 < numstr.length)
		{	var number = numstr;
			if(number<min || number>max)
			{	isValid = false;
				snapFocusObject(locVar);
				if ((1 == UiCode) && (min!=max))
				{	alert(formatMessage("Please give an answer between <<min>> and <<max>> for question <<question>>.", realName, min, max));
				} else if (0 != UiCode)
				{	alert(formatMessage("Text out of range.", realName));
				}
			}
		}
	}
	return isValid;
}
// Validation
function DateRange(vName,realName,min,max,UiCode)
{	var varDate = getVarDate(vName,realName);
	var isValid = ("invalid" != varDate);
	if(isValid && ("" != varDate))
	{	if((varDate.getTime() < min.getTime())||(varDate.getTime() > max.getTime()))
		{	isValid = false;
			var locVar=snapObject(vName);
			if (locVar != null)
			{	snapFocusObject(locVar);
			}
			if ((1 == UiCode) && (min.getTime()!=max.getTime()))
			{	alert(formatMessage("Please give an answer between <<min>> and <<max>> for question <<question>>.", realName, FormatDate(min), FormatDate(max)));
			} else if (0 != UiCode)
			{	alert(formatMessage("You've entered an invalid date or date format for question <<question>>.", realName));
			}
		}
	}
	return isValid;
}
// Validation
function getVarDate(vName,realName)
{	var indate="";
	var locVar = snapObject(vName+ "_1");
	if (locVar != null)
		indate=snapOpenValue(vName);;
	if(indate==null || indate.length==0)
		return "";
	var punct;
	if(indate.indexOf(".")!=-1)
		punct=".";
	else if(indate.indexOf("-")!=-1)
		punct="-";
	else
		punct="/";
	var day;
	var month;
	var year;
	var warningMessage;
	if (0)//true=uk,false=usa
	{	day=indate.substring(0,indate.indexOf(punct));
		month=indate.substring(indate.indexOf(punct)+1,indate.lastIndexOf(punct));
		warningMessage = "Please use the DD/MM/YY format.";
	} else
	{	month=indate.substring(0,indate.indexOf(punct));
		day=indate.substring(indate.indexOf(punct)+1,indate.lastIndexOf(punct));
		warningMessage = "Please use the MM/DD/YY format.";
	}
	year=indate.substring(indate.lastIndexOf(punct)+1,indate.length);
	month = getMonthName(month-1);
	if (year.length == 2)
	{	if (30 > parseInt(year, 10))
		{	year = "20"+year;
		} else
		{	year = "19"+year;
		}
	}
	if (month=="" || year.length != 4 || parseInt(day, 10) > 31)
	{	snapFocusObject(locVar);
		alert(formatMessage("You've entered an invalid date or date format for question <<question>>.\n", realName)+warningMessage);
		return "invalid";
	}
	if (day.length == 1)
		day = "0" + day;
	var varDate = new Date(Date.parse(month + " " + day + ", " + year));
	var cmpDate1 = day + "/" + month + "/" + year;
	var month2 = getMonthName(varDate.getMonth());
	day = varDate.getDate();
	if (day.toString().length == 1)
	{	day = "0" + day;
	}
	var cmpDate2 = day + "/" + month2 + "/" + varDate.getFullYear();
	if (cmpDate1 != cmpDate2)
	{	snapFocusObject(locVar);
		alert(formatMessage("You've entered an invalid date or date format for question <<question>>.\n", realName)+warningMessage);
		return "invalid";
	}
	return varDate;
}
// Validation
function isValidDate(vName,realName)
{	var varDate = getVarDate(vName,realName);
	return ("invalid" != varDate);
}
// Validation
function TimeRange(vName,realName,min,max,UiCode)
{	var varTime = getVarTime(vName,realName);
	var isValid = ("invalid" != varTime);
	if(isValid && ("" != varTime))
	{	if((varTime.getTime() < min.getTime())||(varTime.getTime() > max.getTime()))
		{	isValid = false;
			var locVar = snapObject(vName);
			snapFocusObject(locVar);
			if ((1 == UiCode) && (min.getTime()!=max.getTime()))
			{	alert(formatMessage("Please give an answer between <<min>> and <<max>> for question <<question>>.", realName, FormatTime(min), FormatTime(max)));
			} else if (0 != UiCode)
			{	alert(formatMessage("You've entered an invalid time or time format for question <<question>>.", realName));
			}
		}
	}
	return isValid;
}
// Validation
function getVarTime(vName,realName)
{	var intime="";
	var locVar = snapObject(vName+ "_1");
	if (locVar != null)
		intime=snapOpenValue(vName);;
	if(intime.length==0)
		return "";
	var punct;
	if(intime.indexOf(".")!=-1)
		punct=".";
	else if(intime.indexOf("-")!=-1)
		punct="-";
	else
		punct=":";
	var hour = "00";
	var minute = "00";
	var second = "00";
	var times = intime.split(punct);
	if(times.length >= 1)
		hour = times[0];
	if(times.length >= 2)
		minute = times[1];
	if(times.length >= 3)
		second = times[2];
	if(parseInt(hour, 10) > 23 || parseInt(minute, 10) > 59 || parseInt(second, 10) > 59)
	{	snapFocusObject(locVar);
		alert(formatMessage("You've entered an invalid time or time format for question <<question>>.\n", realName)+"Please use the hh:mm:ss format.");
		return "invalid";
	}
	if (hour.length == 1)
		hour = "0" + hour;
	if (minute.length == 1)
		minute = "0" + minute;
	if (second.length == 1)
		second = "0" + second;
	var varTime = new Date(Date.parse("1/1/1970 " + hour + ":" + minute + ":" + second));
	var cmpTime1 = hour + ":" + minute + ":" + second;
	hour = varTime.getHours();
	minute = varTime.getMinutes();
	second = varTime.getSeconds();
	if (hour.toString().length == 1)
		hour = "0" + hour;
	if (minute.toString().length == 1)
		minute = "0" + minute;
	if (second.toString().length == 1)
		second = "0" + second;
	var cmpTime2 = hour + ":" + minute + ":" + second;
	if (cmpTime1 != cmpTime2)
	{	snapFocusObject(locVar);
		alert(formatMessage("You've entered an invalid time or time format for question <<question>>.\n", realName)+"Please use the hh:mm:ss format.");
		return "invalid";
	}
	return varTime;
}
// Validation
function AnswerRange(vName,realName,min, max)
{	var valid = true;
	var numCodes = snapNumCodes(vName);
	var count = 0;
	if (snapIsDropdown(vName))
	{	var control = snapObject(vName + '_1');
		if (control && (control.options != null))
		{	for (var x = 0; (x < control.options.length); x++)
			{	if (control.options[x].selected && (control.options[x].value>0))
				{	count++;
				}
			}
		}
	}else
	{	for (var x=1; x <= numCodes; x++)
		{	var codeOb = snapObject(vName + '_' + x);
			if (codeOb && (codeOb.checked))
			{	count++;
			}
		}
	}
	if (count < min)
	{	valid = false;
	}else if (count > max)
	{	valid = false;
	}
	if (!valid)
	{	alert(formatMessage("Question <<question>> requires between <<min>> and <<max>> replies.", realName, min, max));
	}
	return valid;
}
// Validation
function isValidTime(vName,realName)
{	var varTime = getVarTime(vName,realName);
	return ("invalid" != varTime);
}
// Validation
function ValidationPattern(vName,patternIndex)
{	var Result=true;
	var locVar = snapObject(vName + "_1");
	var sVar = snapVars[vName];
	var PatternOb = snapGetPattern(patternIndex);
	if (sVar && locVar && PatternOb)
	{	var realName = sVar.qName ? sVar.qName : vName;
		var indate=snapOpenValue(vName);
		if(indate!=null && indate.length>0 && indate.search)
		{	Result=(0<=indate.search(PatternOb.pattern));
			if(!Result)
			{	alert(formatMessage("You've entered an invalid <<pattern>> for question <<question>>.", realName, null, null, PatternOb.patternName));
			}
		}
	}
	return Result;
}
function snapGetPattern(patternIndex)
{	if (!usedPatterns)
	{	usedPatterns = new Object();
	}
	return usedPatterns[patternIndex];
}
function SnapPattern(index, pattern, patternName)
{	this.pattern = pattern;
	this.patternName = patternName;
	usedPatterns[index] = this;
}
////////////////////////////////////////////////////////////////////////////////
// Date and Time
function snapIsUk(){return (0 != 0);}
function setVarValue(qName, qValue)
{	var elem = snapObject(qName);
	if (elem && elem.tagName != null)
	{	var lTagName = elem.tagName.toLowerCase();
		if (lTagName=="input")
		{	if ((elem.type!= null) && (elem.type.toLowerCase() == 'text' || elem.type.toLowerCase() == 'hidden'))
			{	elem.value = unescape(qValue);
			}else if (elem.checked != null)
			{	elem.checked = (qValue == "1") ? true : false;
			}
		}else if (lTagName=="textarea")
		{	elem.value = unescape(qValue);
		}else if (lTagName=="select" && (null != elem.options))
		{	qValue = unescape(qValue);
			var sels = qValue.split(',');
			for (var x = 0; x < elem.options.length; x++)
			{	if (elem.options[x].value != "")
				{	elem.options[x].selected = false;
					for (var op =0; op < sels.length; op++)
					{	if (elem.options[x].value==sels[op])
							elem.options[x].selected=true;
					}
				}
			}
		}
	}
}

function getFormValues() {
	var ret = {};
	for (var i = 0; i < document.forms.SnapForm.elements.length; i++) {
		var elem = document.forms.SnapForm.elements[i];
		var id = elem.id;
		var value = elem.value;
		if ((elem.type == 'hidden') || ((elem.type == 'radio' || elem.type == 'checkbox')  && !elem.checked))
			continue;
		if (id && (id.trim().length > 0) && value && (value.trim().length > 0))
			ret[id] = value;
	}
	return JSON.stringify(ret);
}

function sendFormByMail() {
	var serializedForm = encodeURIComponent("Thank you for filling the feedback form.%0APlease send the form data below by clicking send.%0A%0A" + getFormValues());
	window.open("data:text/html;charset=utf-8,<script>window.location.href='mailto:sandblast-feedback@checkpoint.com?subject=SandBlast%20Feedback&body=" + serializedForm + "'; setTimeout(window.close, 1000);</script>");
	chrome.runtime.sendMessage({"command": "feedback_sent"}); /* TODO make it work for all browsers */
}

function fillForm(json) {
	for (var id in json) {
		document.getElementById(id).value = json[id];
		document.getElementById(id).click();
	}
}

////////////////////////////////////////////////////////////////////////////////
//hide everything for load
//document.write("<style type='text/css'>\n<!--\n.hideDiv{display:none;}\n-->\n<\/style>");
//-->

/*if (document.createTextNode)
{	var temp = document.createTextNode("");
	if (temp.removeChild != null)
	{document.write("<p id='snapIntro'>Please wait while the survey loads...<br><br><a href='http://www.snapsurveys.com/' target='_blank' title='visit SnapSurveys.com (opens a new window)'>Powered by SnapSurveys<\/a><\/p>");
	}
}*/