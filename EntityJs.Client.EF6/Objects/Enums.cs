using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public enum ConditionsEnum
    {
        Equals,
        MoreThan,
        LessThan,
        EqualsOrMoreThan,
        EqualsOrLessThan,
        NotEquals,
        Like,
        IsNull,
        IsNotNull
    };

    public enum DataTypesEnum
    {
        String,
        Date,
        Time,
        Number,
        Bool,
        Group
    };

    public enum OperandsEnum
    {
        And, Or
    };

    public enum OperationResultsEnum
    {
        Passed,
        EntityCanceled,
        OperationCanceled
    };

    public enum ActionsEnum
    {
        None,
        Append,
        Add,
        Deduct
    };

    public enum ExportTypesEnum
    {
        AllRows,
        CurrentPage
    }
}
