using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Objects;
using System.Data.Objects.DataClasses;
using EntityJs.Client.Objects;

namespace EntityJs.Client.Events
{
    public class CheckPermissionsEventArgs : EntityEventArgs
    {
        public CheckPermissionsEventArgs(ObjectContext Context, string EntitySetName, string EntityName, EntityObject Entity, ActionsEnum Action)
            : this(Context, EntitySetName, EntityName, Entity, new Dictionary<string, object>(), Action)
        {
        }

        public CheckPermissionsEventArgs(ObjectContext Context, string EntitySetName, string EntityName, EntityObject Entity, Dictionary<string, object> Values, ActionsEnum Action)
            : base(Context, EntitySetName, EntityName, Entity, Values, Action)
        {
            Cancel = true;
            Errors = new List<string>();
        }

        public OperationResultsEnum Result
        { get; set; }

        public bool Cancel
        {
            get
            {
                return Result > OperationResultsEnum.Passed;
            }
            set
            {
                if (value)
                {
                    Result = Result == OperationResultsEnum.OperationCanceled ? Result : OperationResultsEnum.EntityCanceled;
                }
                else
                {
                    Result = OperationResultsEnum.Passed;
                }
            }
        }

        public List<String> Errors { get; protected set; }
    }
}
