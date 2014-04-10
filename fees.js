var fees = module.exports = {
	'整体工程' : [ {
		feeName : '单项工程费用合计',
		feeExpr : 'sum(ccf(单项工程,工程总造价))',
		feeResult : '0'
	}, {
		feeName : '整体工程费用合计',
		feeExpr : '0',
		feeResult : '0'
	}, {
		feeName : '工程总造价',
		feeExpr : 'cf(单项工程费用合计)+cf(整体工程费用合计)',
		feeResult : '0'
	} ],
	'单项工程' : [
			{
				feeName : '单位工程工程费合计',
				feeExpr : 'sum(ccf(单位工程,工程总造价))',
				feeResult : '0'
			},
			{
				feeName : '单项工程费用合计',
				feeExpr : 'cf(措施项目清单费用)+cf(其他项目清单费用)+cf(规费)+cf(税金)',
				feeResult : '0',
				fee : [
						{
							feeName : '措施项目清单费用',
							feeExpr : '100+10*20',
							feeResult : '0'
						},
						{
							feeName : '其他项目清单费用',
							feeExpr : '500+100',
							feeResult : '0'
						},
						{
							feeName : '规费',
							feeExpr : 'cf(工程排污费)+cf(社会保障费)+cf(住房公积金)+cf(河道管理费)',
							feeResult : '0',
							fee : [
									{
										feeName : '工程排污费',
										feeExpr : 'cf(措施项目清单费用)*f(feeRate)',
										feeRate : '0.0348', // 费率
										feeResult : '0'
									},
									{
										feeName : '社会保障费',
										feeExpr : '200*f(feeRate)',
										feeRate : '0.0348', // 费率
										feeResult : '0'
									},
									{
										feeName : '住房公积金',
										feeExpr : 'cf(措施项目清单费用)*f(feeRate)',
										feeRate : '0.0348', // 费率
										feeResult : '0'
									},
									{
										feeName : '河道管理费',
										feeExpr : '(cf(措施项目清单费用)+cf(其他项目清单费用)+cf(工程排污费)+cf(社会保障费)+cf(住房公积金))*f(feeRate)',
										feeRate : '0.0348', // 费率
										feeResult : '0'
									} ]
						},
						{
							feeName : '税金',
							feeExpr : '(cf(措施项目清单费用)+cf(其他项目清单费用)+cf(规费)-cf(河道管理费))*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						} ]
			}, {
				feeName : '工程总造价',
				feeExpr : 'cf(单位工程工程费合计)+cf(单项工程费用合计)',
				feeResult : '0'
			} ],
	'单位工程' : [
			{
				feeName : '分部分项工程量清单费用',
				feeExpr : 'sum(ccf(分部分项,综合合价))',
				feeResult : '0'
			},
			{
				feeName : '措施项目清单费用',
				feeExpr : '0',
				feeResult : '0'
			},
			{
				feeName : '其他项目清单费用',
				feeExpr : '0',
				feeResult : '0'
			},
			{
				feeName : '规费',
				feeExpr : 'cf(工程排污费)+cf(社会保障费)+cf(住房公积金)+cf(河道管理费)',
				feeResult : '0',
				fee : [
						{
							feeName : '工程排污费',
							feeExpr : '(cf(分部分项工程量清单费用)+cf(措施项目清单费用))*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						},
						{
							feeName : '社会保障费',
							feeExpr : '200*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						},
						{
							feeName : '住房公积金',
							feeExpr : '(cf(分部分项工程量清单费用)+cf(措施项目清单费用))*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						},
						{
							feeName : '河道管理费',
							feeExpr : '(cf(分部分项工程量清单费用)+cf(措施项目清单费用)+cf(其他项目清单费用)+cf(工程排污费)+cf(社会保障费)+cf(住房公积金))*f(feeRate)',
							feeRate : '0.0348', // 费率
							feeResult : '0'
						} ]
			},
			{
				feeName : '税金',
				feeExpr : '(cf(分部分项工程量清单费用)+cf(措施项目清单费用)+cf(其他项目清单费用)+cf(规费)-cf(河道管理费))*f(feeRate)',
				feeResult : '0',
				feeRate : '0.0348', // 费率
			},
			{
				feeName : '工程总造价',
				feeExpr : 'cf(分部分项工程量清单费用)+cf(措施项目清单费用)+cf(其他项目清单费用)+cf(规费)+cf(税金)',
				feeResult : '0'
			} ],
	'分部分项' : [ {
		feeName : '人工费合价',
		feeExpr : 'sum(ccf(清单,人工费合价))',
		feeResult : '0'
	}, {
		feeName : '材料费合价',
		feeExpr : 'sum(ccf(清单,材料费合价))',
		feeResult : '0'
	}, {
		feeName : '机械费合价',
		feeExpr : 'sum(ccf(清单,机械费合价))',
		feeResult : '0'
	}, {
		feeName : '直接费合价',
		feeExpr : 'sum(ccf(清单,直接费合价))',
		feeResult : '0'
	}, {
		feeName : '综合合价',
		feeExpr : 'sum(ccf(清单,综合合价))',
		feeResult : '0'
	} ],
	'清单' : [ {
		feeName : '人工费',
		feeExpr : 'cf(人工费合价)/c(quantity)',
		feeResult : '0'
	}, {
		feeName : '人工费合价',
		feeExpr : 'sum(ccf(定额,人工费合价))',
		feeResult : '0'
	}, {
		feeName : '材料费',
		feeExpr : 'cf(材料费合价)/c(quantity)',
		feeResult : '0'
	}, {
		feeName : '材料费合价',
		feeExpr : 'sum(ccf(定额,材料费合价))',
		feeResult : '0'
	}, {
		feeName : '机械费',
		feeExpr : 'cf(机械费合价)/c(quantity)',
		feeResult : '0'
	}, {
		feeName : '机械费合价',
		feeExpr : 'sum(ccf(定额,机械费合价))',
		feeResult : '0'
	}, {
		feeName : '直接费',
		feeExpr : 'cf(人工费)+cf(材料费)+cf(机械费)',
		feeResult : '0'
	}, {
		feeName : '直接费合价',
		feeExpr : 'cf(直接费)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '综合单价',
		feeExpr : 'cf(综合合价)/c(quantity)',
		feeResult : '0'
	}, {
		feeName : '综合合价',
		feeExpr : 'sum(ccf(定额,综合合价))',
		feeResult : '0'
	} ],
	'定额' : [ {
		feeName : '人工费',
		feeExpr : 'sum(ccf(人工,直接费))',
		feeResult : '0'
	}, {
		feeName : '人工费合价',
		feeExpr : 'cf(人工费)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '材料费',
		feeExpr : 'sum(ccf(材料,直接费))',
		feeResult : '0'
	}, {
		feeName : '材料费合价',
		feeExpr : 'cf(材料费)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '机械费',
		feeExpr : 'sum(ccf(机械,直接费))',
		feeResult : '0'
	}, {
		feeName : '机械费合价',
		feeExpr : 'cf(机械费)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '直接费',
		feeExpr : 'cf(人工费)+cf(材料费)+cf(机械费)',
		feeResult : '0'
	}, {
		feeName : '直接费合价',
		feeExpr : 'cf(直接费)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '管理费',
		feeExpr : '1+2',
		feeResult : '0'
	}, {
		feeName : '管理费合价',
		feeExpr : 'cf(管理费)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '利润',
		feeExpr : '1+2*3',
		feeResult : '0'
	}, {
		feeName : '利润合价',
		feeExpr : 'cf(利润)*c(quantity)',
		feeResult : '0'
	}, {
		feeName : '综合单价',
		feeExpr : 'cf(直接费)+cf(管理费)+cf(利润)',
		feeResult : '0'
	}, {
		feeName : '综合合价',
		feeExpr : 'cf(综合单价)*c(quantity)',
		feeResult : '0'
	} ],
	'人工' : [ {
		feeName : '直接费',
		feeExpr : 'c(price)*c(content)',
		feeResult : '0'
	} ],
	'材料' : [ {
		feeName : '直接费',
		feeExpr : 'c(price)*c(content)',
		feeResult : '0'
	} ],
	'机械' : [ {
		feeName : '直接费',
		feeExpr : 'c(price)*c(content)',
		feeResult : '0'
	} ]
};