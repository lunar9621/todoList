import { Input, Form, Table, Radio, Popconfirm, Button, message } from 'antd';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import React, { Component } from 'react';
import { Link } from 'umi';
import { connect } from 'dva';
import EditableCell from './components/EditableCell';
import styles from './style.less';
const { Search } = Input;
const EditableContext = React.createContext();

const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);
class TodoList extends Component {

  state = {
    length: 0,
    selectedRowKeys: [],
    storeAll: [],
    activeLength: 0,
    completeLength: 0,
    eventList: [],
    status: 'All',
  };
  columns = [
    {
      title: '事件名称',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      width: '60%',
      editable: true,
    },
    {
      title: '操作',
      key: 'operation',
      align: 'center',
      dataIndex: 'operation',
      width: '20%',
      render: (text, record) =>
        this.state.eventList.length >= 1 ? (
          <Popconfirm title={formatMessage({
            id: 'Sure to delete?',
          })} onConfirm={() => this.handleDelete(record.index)}>
            <a><FormattedMessage id="Delete" /></a>
          </Popconfirm>
        ) : null,
    },
  ]

  handleDelete = index => {
    const storeAll = [...this.state.storeAll];
    this.setState({ storeAll: storeAll.filter(item => item.index !== index) }, () => { this.changeEventList() });
  };

  addEvent = value => {
    let tmpstoreAll = this.state.storeAll;
    tmpstoreAll.push({
      index: this.state.length,
      name: value,
      done: false,
    })
    let tmplength = this.state.length + 1;
    this.setState({
      length: tmplength,
      storeAll: tmpstoreAll,
    }, () => { this.changeEventList() });
    this.props.form.resetFields(['input']);
  }

  handleSave = row => {
    let newData = JSON.parse(JSON.stringify(this.state.storeAll));
    let index = newData.findIndex(item => row.index=== item.index);
    let item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    this.setState({
      storeAll: newData
    }, () => { this.changeEventList() });
  };

  onChange = e => {
    console.log(`radio checked:${e.target.value}`);
    let status;
    if (e.target.value == 'a') {
      status = 'All';
    } else if (e.target.value == 'b') {
      status = 'Active';
    } else {
      status = 'Completed';
    }
    this.setState({
      status,
    }, () => this.changeEventList());
  }

  changeEventList() {
    const { status, storeAll, selectedRowKeys } = this.state;
    let eventList, tempselectedRowKeys = [], flag = 0, completeLength = 0, activeLength = 0;
    if (status === 'All') {
      eventList = storeAll;
    } else if (status === 'Active') {
      eventList = storeAll.filter(item => item.done === false);
    } else {
      eventList = storeAll.filter(item => item.done === true);
    }
    console.log('eventList', storeAll, eventList);
    for (let i = 0; i < storeAll.length; i++) {
      if (storeAll[i].done === true) {
        completeLength++;
      }
    }
    activeLength = storeAll.length - completeLength;
    for (let i = 0; i < eventList.length; i++) {
      if (eventList[i].done === true) {
        tempselectedRowKeys.push(flag);
      }
      flag++;
    }
    this.setState({
      eventList,
      selectedRowKeys: tempselectedRowKeys,
      activeLength,
      completeLength,
    });
  }

  onSelectChange = (innerselectedRowKeys, selectedRows) => {
    console.log(`selectedRowKeys: ${innerselectedRowKeys}`, 'selectedRows: ', selectedRows);
    const { eventList } = this.state;
    let realselectedKeys = [];
    for (let i = 0; i < selectedRows.length; i++) {
      realselectedKeys.push(selectedRows[i].index);
    }
    for (let i = 0; i < eventList.length; i++) {
      if (realselectedKeys.indexOf(eventList[i].index) == -1) {
        eventList[i].done = false;
      } else {
        eventList[i].done = true;
      }
    }
    this.setState({
      selectedRowKeys: innerselectedRowKeys,////??
      eventList,
    }, () => { this.changeEventList() })
    console.log('afterselectedRows:', selectedRows, eventList);
  }

  clearCompleted = () => {
    const { storeAll } = this.state;
    let tmpActive = storeAll.filter(item => item.done === false);
    let tmpCompleted = storeAll.filter(item => item.done === true);
    if (tmpCompleted.length == 0) {
      message.error(formatMessage({
        id: 'No completed events',
      }));
    } else {
      this.setState({
        storeAll: tmpActive,
      }, () => { this.changeEventList() })
    }
  }

  render() {
    const { storeAll, eventList, selectedRowKeys, activeLength, completeLength } = this.state;

    const { getFieldDecorator } = this.props.form;
    console.log("render", eventList);
    const rowSelection = {
      selectedRowKeys,
      columnTitle: '完成情况',
      columnWidth: '20%',
      onChange: this.onSelectChange,
      getCheckboxProps: record => ({
        done: false,
      }),
    };
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell,
      },
    };
    const columns = this.columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        }),
      };
    });
    return (
      <div className={styles.main}>
        <Form>
          <div className={styles.InputBlock}>
            <Form.Item className={styles.FormItem}>
              {getFieldDecorator('input')(
                <Search
                  placeholder={formatMessage({
                    id: 'What-needs-to-be-done',
                  })}
                  enterButton={formatMessage({
                    id: 'Add',
                  })}
                  size="large"
                  onSearch={value => this.addEvent(value)}
                />)}
            </Form.Item>
          </div>
          <div className={styles.OperationBlock} >
            <div className={styles.StatusBlock}>
              <Radio.Group onChange={this.onChange} defaultValue="a">
                <Radio.Button value="a"><FormattedMessage id="All" />({storeAll.length})</Radio.Button>
                <Radio.Button value="b"><FormattedMessage id="Active" />({activeLength})</Radio.Button>
                <Radio.Button value="c"><FormattedMessage id="Completed" />({completeLength})</Radio.Button>
              </Radio.Group>
            </div>
            <div className={styles.ClearBlock}>
              <Popconfirm title={formatMessage({
                id: 'Sure to clear completed event?',
              })} onConfirm={this.clearCompleted}>
                <Button> <FormattedMessage id="clearCompleted" /></Button>
              </Popconfirm>
            </div>
          </div>
          <div class={styles.ListBlock} >
            <Table
              components={components}
              rowClassName={() => 'editable-row'}
              bordered={false}
              pagination={false}
              scroll={{ y: 300 }}
              dataSource={eventList}
              columns={columns}
              rowSelection={rowSelection}
            />
          </div>
        </Form>
      </div>
    );
  }
}

export default Form.create()(TodoList);


